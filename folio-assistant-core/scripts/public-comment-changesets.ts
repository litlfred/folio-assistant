#!/usr/bin/env bun
/**
 * public-comment-changesets — propose, render and open CHANGE-SET issues for
 * a public review (issue #2183). Skill: `public-comment` §"Change-sets".
 * Process: `public-comment.bpmn`, Task_ProposeChangeSets and
 * Task_GroupChangeSets.
 *
 * ## The division of labour
 *
 * An ISSUE is where people agree what one change should do; the PR that
 * closes it is where they preview the change and approve the merge. An agent
 * may PROPOSE every change-set — that is what this tool is for — but the
 * proposal is only a draft until people have discussed it on its issue.
 *
 *   seed [--out f.json]          comments not yet in a change-set, bucketed by
 *                                section: the agent's INPUT, never a proposal
 *   add --title T --requirements R --refs PC-1,PC-2 [--anchor L] [--by who]
 *                                record one proposed change-set (CS-001, …)
 *   list                         the proposals, and which have an issue
 *   body <CS-001>                the issue body, ready to open
 *   link <CS-001> --issue N [--by who]
 *                                record the opened issue and group its comments
 *
 * Every command accepts `--repo <folio root>` and `--store <dir>`, as
 * `public-comment.ts` does. Opening the issue itself is left to whoever holds
 * the GitHub credentials — an agent through its GitHub tools, a person, or a
 * workflow — and `link` records the result, so this tool never needs a token.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { CHANGE_SET_SCHEMA, ChangeSetSchema, OPEN_STATUSES, type ChangeSet, type PublicComment } from "../schemas/public-comment.js";
import { Store } from "./public-comment.js";

const dirOf = (store: Store) => join(store.dir, "changesets");

export function changeSets(store: Store): ChangeSet[] {
  const d = dirOf(store);
  if (!existsSync(d)) return [];
  return readdirSync(d)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ChangeSetSchema.parse(JSON.parse(readFileSync(join(d, f), "utf-8"))));
}

export function saveChangeSet(store: Store, cs: ChangeSet): void {
  mkdirSync(dirOf(store), { recursive: true });
  writeFileSync(join(dirOf(store), `${cs.id}.json`), JSON.stringify(ChangeSetSchema.parse(cs), null, 2) + "\n");
}

/** Where a comment sits, as the section a reader would look for: "4.3", "C · Client Registry", or "whole document". */
export function bucketOf(c: PublicComment, store: Store): { key: string; title: string } {
  const label = c.public.anchor.targetLabel;
  if (!label) return { key: "whole-document", title: "About the whole document" };
  const a = store.anchors();
  const secs = new Map(a.sections.map((s) => [s.label, s]));
  const block = a.blocks.find((b) => b.label === label);
  const path = block ? block.sections : [label];
  // The deepest NUMBERED section at most two levels down (4.3, not 4.3.2.1),
  // or an appendix component by its title: the unit a change-set usually spans.
  let best: { key: string; title: string } | undefined;
  for (const l of path) {
    const s = secs.get(l);
    if (!s) continue;
    if (s.number && s.number.split(".").length <= 2) best = { key: s.number, title: s.title };
    else if (!s.number && best && /^[A-Z]$/.test(best.key)) best = { key: `${best.key} · ${s.title}`, title: s.title };
  }
  if (best) return best;
  const ch = a.chapters.find((x) => x.label === label || x.dir === block?.chapter);
  return { key: ch?.dir ?? label, title: ch?.title ?? label };
}

/**
 * The agent's input: every OPEN comment not yet in a change-set, in buckets by
 * section. A bucket is not a change-set — one section's comments usually ask
 * for several different changes, and one change sometimes spans sections.
 */
export function seed(store: Store) {
  const taken = new Set(changeSets(store).flatMap((cs) => cs.refs));
  const buckets = new Map<string, { key: string; title: string; comments: unknown[] }>();
  for (const c of store.all()) {
    if (!OPEN_STATUSES.includes(c.status) && c.status !== "decided") continue;
    if (c.public.issues.length || taken.has(c.public.ref)) continue;
    const b = bucketOf(c, store);
    const entry = buckets.get(b.key) ?? { ...b, comments: [] };
    entry.comments.push({
      ref: c.public.ref,
      target: c.public.anchor.targetLabel,
      type: c.public.type,
      text: c.public.text,
      ...(c.public.suggestedRevision ? { suggested: c.public.suggestedRevision } : {}),
      ...(c.public.labels ? { labels: c.public.labels } : {}),
      ...(c.public.decision ? { decision: c.public.decision.code } : {}),
    });
    buckets.set(b.key, entry);
  }
  return [...buckets.values()].sort((x, y) => x.key.localeCompare(y.key, undefined, { numeric: true }));
}

export function addChangeSet(store: Store, p: { title: string; requirements: string; refs: string[]; anchor?: string; by: string; at: string }): ChangeSet {
  const known = new Set(store.all().map((c) => c.public.ref));
  const unknown = p.refs.filter((r) => !known.has(r));
  if (unknown.length) throw new Error(`not comments in the store: ${unknown.join(", ")}`);
  const n = changeSets(store).reduce((m, cs) => Math.max(m, Number(cs.id.slice(3))), 0) + 1;
  const cs: ChangeSet = {
    $schema: CHANGE_SET_SCHEMA,
    id: `CS-${String(n).padStart(3, "0")}`,
    title: p.title,
    requirements: p.requirements,
    refs: [...new Set(p.refs)],
    ...(p.anchor ? { anchor: p.anchor } : {}),
    proposedBy: p.by,
    proposedAt: p.at,
  };
  saveChangeSet(store, cs);
  return cs;
}

const clip = (s: string, n: number) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};
const cell = (s: string) => s.replace(/\|/g, "\\|");

/** The marker an issue body carries, so a re-render finds its change-set. */
export const changeSetMarker = (id: string) => `<!-- public-comment-changeset ${id} -->`;

/**
 * The issue body. Kept under GitHub's 65,536-character limit by clipping each
 * comment's excerpt; the full text is one click away on the dashboard.
 */
export function issueBody(cs: ChangeSet, store: Store): string {
  const cfg = store.config() as { site?: string; document: string };
  const site = (cfg.site ?? "").replace(/\/$/, "");
  const byRef = new Map(store.all().map((c) => [c.public.ref, c]));
  const rows = cs.refs.map((ref) => {
    const c = byRef.get(ref)!;
    const where = c.public.anchor.targetLabel
      ? site
        ? `[${cell(clip(c.public.citation.raw || c.public.anchor.targetLabel, 40))}](${site}/${cfg.document}/#${c.public.anchor.targetLabel})`
        : cell(c.public.anchor.targetLabel)
      : "whole document";
    const refLink = site ? `[${ref}](${site}/public-comments/#${ref})` : ref;
    return `| ${refLink} | ${where} | ${cell(clip(c.public.text, 220))} | ${cell(clip(c.public.suggestedRevision ?? "", 160))} |`;
  });
  return [
    changeSetMarker(cs.id),
    `**Change-set ${cs.id}**, proposed by ${cs.proposedBy}. This issue is where the requirements are agreed. The change itself is previewed and approved on the pull request that closes it.`,
    "",
    "## Requirements",
    "",
    cs.requirements,
    "",
    `## Comments (${cs.refs.length})`,
    "",
    `pc: ${cs.refs.join(", ")}`,
    "",
    "| Ref | Where | Comment | Suggested revision |",
    "|---|---|---|---|",
    ...rows,
    "",
    "## How this issue is used",
    "",
    "- **Agree the requirements** in this thread. Edit the `pc:` line above to add or remove comments; the record follows it.",
    `- **Decide** the comments, one by one or all at once: \`pc: #<this issue>\` then \`decide: accepted\` (or accepted-modified, not-accepted, noted, deferred) and the reason.`,
    "- **Make the change** on a branch and open a pull request whose body says `Closes #<this issue>`. Its staging preview shows the text before and after; the accepted comments move to *editing*.",
    "- **Merge** the pull request when it is approved: the accepted comments move to *incorporated*.",
  ].join("\n");
}

/** Record the opened issue on the change-set, and group its comments under it. */
export function linkIssue(store: Store, id: string, issue: number, by: string, at: string): { added: string[] } {
  const cs = changeSets(store).find((x) => x.id === id);
  if (!cs) throw new Error(`no change-set ${id}`);
  saveChangeSet(store, { ...cs, issue });
  const added: string[] = [];
  for (const ref of cs.refs) {
    const c = store.get(ref);
    if (c.public.issues.includes(issue)) continue;
    store.save({
      ...c,
      public: {
        ...c.public,
        issues: [...c.public.issues, issue].sort((a, b) => a - b),
        history: [...c.public.history, { at, transition: "group", by, task: "Process_PublicComment#Task_GroupChangeSets", note: `${cs.id}: added to change-set issue #${issue}` }],
      },
    });
    added.push(ref);
  }
  return { added };
}

if (import.meta.main) {
  const [cmd, ...args] = process.argv.slice(2);
  const opt = (n: string) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const positional = args.find((a, i) => !a.startsWith("--") && (i === 0 || !args[i - 1]!.startsWith("--")));
  const store = Store.open(resolve(opt("repo") ?? process.cwd()), opt("store"));
  const at = new Date().toISOString();
  const by = opt("by") ?? process.env.GITHUB_ACTOR ?? "agent";
  try {
    switch (cmd) {
      case "seed": {
        const out = JSON.stringify(seed(store), null, 1);
        if (opt("out")) writeFileSync(resolve(opt("out")!), out + "\n");
        else console.log(out);
        break;
      }
      case "add": {
        const title = opt("title"), requirements = opt("requirements"), refs = opt("refs");
        if (!title || !requirements || !refs) throw new Error("add --title T --requirements R --refs PC-0001,PC-0002 [--anchor label] [--by who]");
        const cs = addChangeSet(store, { title, requirements, refs: refs.split(/[,\s]+/).filter(Boolean), ...(opt("anchor") ? { anchor: opt("anchor")! } : {}), by, at });
        console.error(`✓ ${cs.id}: ${cs.refs.length} comment(s), "${cs.title}"`);
        break;
      }
      case "list":
        for (const cs of changeSets(store)) console.log(`${cs.id}  ${cs.issue ? `#${cs.issue}`.padEnd(6) : "—".padEnd(6)} ${String(cs.refs.length).padStart(3)}  ${cs.title}`);
        break;
      case "body": {
        const cs = changeSets(store).find((x) => x.id === positional);
        if (!cs) throw new Error(`body <CS-001>: no change-set ${positional ?? ""}`);
        console.log(issueBody(cs, store));
        break;
      }
      case "link": {
        const n = Number(opt("issue"));
        if (!positional || !n) throw new Error("link <CS-001> --issue N");
        const r = linkIssue(store, positional, n, by, at);
        console.error(`✓ ${positional} → #${n}; ${r.added.length} comment(s) grouped`);
        break;
      }
      default:
        throw new Error(`unknown command "${cmd}". seed | add | list | body | link — see the module docblock.`);
    }
  } catch (e) {
    console.error(`✗ ${(e as Error).message}`);
    process.exit(1);
  }
}
