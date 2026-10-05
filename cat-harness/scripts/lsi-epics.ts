#!/usr/bin/env bun
/**
 * Propose an epic for every open bean, open PR and unmerged branch — the
 * qou project-management hierarchy (`todo-manager`, `session-intent`: every
 * piece of work is a child of a parent bean) applied to the work plan as it
 * stands, with Latent Semantic Indexing as the fallback evidence.
 *
 * @covers beans
 *
 * ## It PROPOSES; it never writes a parent
 *
 * `methodologies/lsi.md` refusal 3: LSI output never writes a relation. This
 * script writes a report and nothing else; `beans update --parent` is a
 * person's (or a reviewing agent's) act, one bean at a time.
 *
 * ## Two kinds of evidence, never merged
 *
 * 1. **explicit** — the item already names its home: a bean's `parent:` chain
 *    reaches an epic, or a branch's commit messages name a bean id whose chain
 *    does. Deterministic, and it wins.
 * 2. **latent** — cosine, in the LSI space built over EVERY bean (all
 *    statuses, so a completed child still teaches its epic's vocabulary),
 *    between the item and each epic's centroid (the epic plus all its
 *    descendants, each normalised). A PR or branch is not a bean, so it is
 *    FOLDED IN (method step 6) from its title, branch name and commit
 *    messages.
 *
 * The report carries the margin between the best and second-best epic,
 * because a best guess that barely beats the runner-up is not a proposal, it
 * is a coin toss — and says so.
 *
 *   bun run lsi:epics [--out <file.md>]
 *   bun run lsi:near "<planned bean title>" [--body "<text>"]
 *   bun run lsi:epics --method ca        # the parallel track (correspondence analysis)
 *   LSI_DUMP=<file.json> bun run lsi:epics  # per-bean agreement, for a PAIRED comparison
 */

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildLsi, centroid, cosineVectors, foldIn, unitVector, type LsiIndex } from "../content/pipeline/lsi";
import { declaredGraphs } from "../schemas/cat-harness";
import { buildCa } from "../content/pipeline/ca";
import { BEAN_GRAPH_FILE } from "../schemas/bean-graph";

const REPO = resolve(import.meta.dir, "../..");

/** Every directory the bean graph declares as holding `bean-defs` — `defs` and
 *  its `archive` view — read from the declarations rather than spelled here. */
function beanDefDirs(): string[] {
  const store = [REPO, join(REPO, "cat-harness")].flatMap((r) => declaredGraphs(r)).find((g) => g.graphTypologies.includes("beans"))?.absPath;
  if (!store) throw new Error("no declared `beans` graph — nothing to file (this is not an empty work plan)");
  const graph = JSON.parse(readFileSync(join(store, BEAN_GRAPH_FILE), "utf8")) as { directories: Array<{ path: string; graphTypologies: string[] }> };
  return graph.directories.filter((d) => d.graphTypologies.includes("bean-defs")).map((d) => join(store, d.path));
}
/** Below this best-cosine an item fits no epic: a candidate for a NEW one. */
const FIT_FLOOR = 0.3;
/** Best minus runner-up below this: ambiguous, a person decides. */
const MARGIN_FLOOR = 0.05;
/** `--near`: a hit this close is worth reading before creating. House
 *  number, measured 2026-09-29: a REWORDED title for the known duplicate pair
 *  `3ozg`/`rmcf` scored 0.72-0.75 against both (a title is short against a
 *  full bean body), while unrelated beans sat below 0.5. */
const NEAR_READ = 0.7;

interface Bean {
  id: string;
  short: string;
  title: string;
  status: string;
  type: string;
  parent?: string;
  file: string;
  text: string;
}

function loadBeans(): Bean[] {
  const files = beanDefDirs().flatMap((d) => readdirSync(d).filter((f) => f.endsWith(".md")).map((f) => join(d, f)));
  return files.map((file) => {
    const text = readFileSync(file, "utf8");
    const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
    const get = (k: string) => fm.match(new RegExp(`^${k}:\\s*(.*)$`, "m"))?.[1]?.replace(/^['"]|['"]$/g, "").replace(/''/g, "'").trim();
    const id = fm.match(/^# (\S+)/m)?.[1] ?? file.split("/").pop()!.split("--")[0];
    return {
      id,
      short: id.replace(/^folio-assistant-/, ""),
      title: get("title") ?? "",
      status: get("status") ?? "",
      type: get("type") ?? "",
      parent: get("parent"),
      file,
      text,
    };
  });
}

const OPEN = new Set(["todo", "in-progress", "draft"]);

function epicOf(b: Bean, byId: Map<string, Bean>): string | undefined {
  let cur: Bean | undefined = b;
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    if (cur.type === "epic" && cur !== b) return cur.id;
    cur = cur.parent ? byId.get(cur.parent) : undefined;
  }
  return undefined;
}

function git(...args: string[]): string {
  try {
    return execFileSync("git", args, { cwd: REPO, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return "";
  }
}

interface Item {
  kind: "bean" | "branch";
  key: string;
  title: string;
  text: string;
  explicit?: string;
  current?: string;
  pr?: number;
  ahead?: number;
  lastCommit?: string;
}

function rankEpics(ix: LsiIndex, v: Float64Array, cents: Map<string, Float64Array>) {
  return [...cents].map(([e, c]) => ({ epic: e, cosine: cosineVectors(v, c) })).sort((a, b) => b.cosine - a.cosine);
}

if (import.meta.main) {
  const outIdx = process.argv.indexOf("--out");
  // Optional `--prs <file.json>`: [{ number, head: { ref } }] as the GitHub API
  // lists open PRs. The checkout cannot know which branches have a PR open.
  const prsIdx = process.argv.indexOf("--prs");
  const prOf = new Map<string, number>(
    prsIdx > 0
      ? (JSON.parse(readFileSync(process.argv[prsIdx + 1], "utf8")) as Array<{ number: number; head: { ref: string } }>).map((p) => [p.head.ref, p.number])
      : [],
  );
  const out = outIdx > 0 ? process.argv[outIdx + 1] : undefined;

  const beans = loadBeans();
  const byId = new Map(beans.map((b) => [b.id, b]));
  const byShort = new Map(beans.map((b) => [b.short, b]));
  const epics = beans.filter((b) => b.type === "epic" && OPEN.has(b.status));
  // `--method ca` runs the parallel track (correspondence analysis) over the
  // same beans, so the two can be compared on the one ground truth this
  // repository has: the epics beans are already filed under.
  const methodIdx = process.argv.indexOf("--method");
  const method = methodIdx > 0 ? process.argv[methodIdx + 1] : "lsi";
  const unitsIn = beans.map((b) => ({ id: b.id, text: b.text }));
  const kOpt = Number(process.env.LSI_K ?? 100);
  const ix =
    method === "ca"
      ? buildCa(unitsIn, { k: kOpt, alpha: Number(process.env.CA_ALPHA ?? 1), weighting: (process.env.LSI_W as "raw" | "tfidf" | "log-entropy") ?? "raw", seed: 1990 })
      : buildLsi(unitsIn, { k: kOpt, weighting: (process.env.LSI_W as "raw" | "tfidf" | "log-entropy") ?? "log-entropy", seed: 1990 });

  const members = new Map<string, string[]>(epics.map((e) => [e.id, [e.id]]));
  for (const b of beans) {
    const e = epicOf(b, byId);
    if (e && members.has(e)) members.get(e)!.push(b.id);
  }

  // ── `--near "<title>"`: the semantic half of check-before-create ──
  //
  // `beans create` dedupes on nothing, and the exact-title check in
  // `todo-manager` §"Check before you create" only catches the SAME words.
  // This folds the planned title (and any `--body`) into the index and shows
  // the closest existing beans of every status, plus the closest epic — so a
  // restatement in different words is seen before the file exists. It prints;
  // deciding that a hit IS the same work is the reader's act.
  const nearIdx = process.argv.indexOf("--near");
  if (nearIdx > 0) {
    const title = process.argv[nearIdx + 1] ?? "";
    const bodyIdx = process.argv.indexOf("--body");
    const text = `${title}\n${bodyIdx > 0 ? process.argv[bodyIdx + 1] : ""}`;
    const v = foldIn(ix, text);
    if (v.every((x) => x === 0)) {
      console.log(`no term of ${JSON.stringify(title)} is in the bean vocabulary — nothing to compare (this is not "no duplicate")`);
      process.exit(0);
    }
    const hits = ix.unitIds
      .map((id) => ({ b: byId.get(id)!, cos: cosineVectors(v, unitVector(ix, id)!) }))
      .sort((a, b) => b.cos - a.cos)
      .slice(0, Number(process.env.LSI_NEAR_TOP ?? 5));
    console.log(`nearest beans to ${JSON.stringify(title)} (latent cosine; READ any >= ${NEAR_READ} before creating):`);
    for (const { b, cos } of hits)
      console.log(`  ${cos.toFixed(2)}${cos >= NEAR_READ ? " ←" : "  "} ${b.short.padEnd(5)} ${b.status.padEnd(11)} ${b.type.padEnd(8)} ${b.title.slice(0, 90)}`);
    const cents = new Map<string, Float64Array>();
    for (const [e, ids] of members) cents.set(e, centroid(ix, ids));
    const [best, second] = rankEpics(ix, v, cents);
    const tag = best.cosine < FIT_FLOOR ? "no epic fits — a new one?" : best.cosine - second.cosine < MARGIN_FLOOR ? `ambiguous vs ${second.epic.replace(/^folio-assistant-/, "")}` : "";
    console.log(`closest epic: ${best.epic.replace(/^folio-assistant-/, "")} ${byId.get(best.epic)!.title.split(":")[0]} (${best.cosine.toFixed(2)}) ${tag}`);
    process.exit(0);
  }

  // ── Items: open non-epic beans, and unmerged branches ──
  const items: Item[] = [];
  for (const b of beans) {
    if (!OPEN.has(b.status) || b.type === "epic" || b.type === "milestone") continue;
    items.push({ kind: "bean", key: b.short, title: b.title, text: b.text, current: epicOf(b, byId) });
  }
  const branches = git("branch", "-r", "--no-merged", "origin/main")
    .split("\n").map((s) => s.trim())
    // gh-pages is the publish target, not work; a branch pointer is not a branch.
    .filter((s) => s && !s.includes("->") && s !== "origin/gh-pages");
  for (const br of branches) {
    const log = git("log", "--no-merges", "--format=%s%n%b", `origin/main..${br}`);
    const ahead = Number(git("rev-list", "--count", `origin/main..${br}`).trim() || 0);
    const last = git("log", "-1", "--format=%cs", br).trim();
    const name = br.replace(/^origin\//, "");
    // Explicit: bean ids named in the commit messages or the branch name.
    const named = new Map<string, number>();
    for (const m of `${name}\n${log}`.matchAll(/(?:folio-assistant-|bean[s]? `?|`)([0-9a-z]{4})\b/gi)) {
      { const s = m[1].toLowerCase(); if (byShort.has(s)) named.set(s, (named.get(s) ?? 0) + 1); }
    }
    let explicit: string | undefined;
    for (const [s] of [...named].sort((a, b) => b[1] - a[1])) {
      const b = byShort.get(s)!;
      const e = b.type === "epic" ? b.id : epicOf(b, byId);
      if (e && members.has(e)) { explicit = e; break; }
    }
    items.push({ kind: "branch", key: name, title: log.split("\n")[0] || name, text: `${name.replace(/[-_/]/g, " ")}\n${log}`, explicit, ahead, lastCommit: last, pr: prOf.get(name) });
  }

  // ── Score ──
  const rows = items.map((it) => {
    const self = it.kind === "bean" ? byShort.get(it.key)!.id : undefined;
    const cents = new Map<string, Float64Array>();
    for (const [e, ids] of members) cents.set(e, centroid(ix, ids.filter((i) => i !== self)));
    const v = self ? unitVector(ix, self)! : foldIn(ix, it.text);
    const ranked = rankEpics(ix, v, cents);
    const [best, second] = ranked;
    const toExplicit = it.explicit ? ranked.find((r) => r.epic === it.explicit)?.cosine : undefined;
    return { ...it, best, second, margin: best.cosine - (second?.cosine ?? 0), toExplicit };
  });

  // ── Report ──
  const short = (id?: string) => (id ? id.replace(/^folio-assistant-/, "") : "—");
  const title = (id?: string) => (id ? byId.get(id)!.title.split(":")[0] : "");
  const lines: string[] = [];
  const counts = { filed: 0, agree: 0, disagree: 0, unfiled: 0, noFit: 0, ambiguous: 0 };
  const section = (h: string, rs: typeof rows, fmt: (r: (typeof rows)[number]) => string) => {
    lines.push(`\n## ${h} (${rs.length})\n`);
    if (rs.length) lines.push("| item | proposal | cos | margin | note |", "|---|---|---|---|---|", ...rs.map(fmt));
  };
  const fmtRow = (r: (typeof rows)[number], note: string) =>
    `| ${r.kind === "bean" ? `\`${r.key}\`` : `branch \`${r.key}\``} ${r.title.replace(/\|/g, "\\|").slice(0, 90)} | \`${short(r.best.epic)}\` ${title(r.best.epic)} | ${r.best.cosine.toFixed(2)} | ${r.margin.toFixed(2)} | ${note} |`;

  const beanRows = rows.filter((r) => r.kind === "bean");
  const branchRows = rows.filter((r) => r.kind === "branch");
  const unfiled = beanRows.filter((r) => !r.current);
  const filed = beanRows.filter((r) => r.current);
  const disagree = filed.filter((r) => r.best.epic !== r.current && r.margin >= MARGIN_FLOOR && r.best.cosine >= FIT_FLOOR);
  counts.filed = filed.length;
  counts.agree = filed.filter((r) => r.best.epic === r.current).length;
  counts.disagree = disagree.length;
  counts.unfiled = unfiled.length;

  lines.push(`# LSI epic-filing proposal — ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");
  lines.push(`Generated by \`bun run lsi:epics\`. **A proposal, not an edit** — no parent was written (methodology \`lsi\`, refusal 3).`);
  lines.push(`Index: ${ix.unitIds.length} beans (every status), ${ix.terms.length} terms, k=${ix.k}, retained ${(ix.retained * 100).toFixed(1)}%. Classes: ${epics.length} open epics, each a centroid of itself and all its descendants.`);
  lines.push("");
  lines.push(`**Calibration.** Of ${counts.filed} open beans already under an epic, LSI's best epic equals the current one for **${counts.agree}** (${((100 * counts.agree) / Math.max(1, counts.filed)).toFixed(0)}%). That agreement rate is how far to trust the proposals below.`);
  lines.push(`Thresholds (house, adjustable in the script): no-fit below cosine ${FIT_FLOOR}; ambiguous when the margin over the runner-up is below ${MARGIN_FLOOR}.`);

  section("Open beans with no epic — proposed home", unfiled.sort((a, b) => b.best.cosine - a.best.cosine), (r) =>
    fmtRow(r, r.best.cosine < FIT_FLOOR ? "**no fit** — new epic?" : r.margin < MARGIN_FLOOR ? `ambiguous vs \`${short(r.second?.epic)}\`` : "latent"));
  section("Open beans whose current epic LSI disputes — review, do not move blindly", disagree.sort((a, b) => b.margin - a.margin), (r) =>
    fmtRow(r, `now under \`${short(r.current)}\` ${title(r.current)}`));
  const withExplicit = branchRows.filter((r) => r.explicit);
  const latentOnly = branchRows.filter((r) => !r.explicit);
  section("Unmerged branches that name a bean — explicit home", withExplicit.sort((a, b) => (a.lastCommit! < b.lastCommit! ? 1 : -1)), (r) =>
    fmtRow({ ...r, best: { epic: r.explicit!, cosine: r.toExplicit ?? 0 } }, `explicit${r.pr ? `; **PR #${r.pr}**` : ""}; ${r.ahead} ahead, last ${r.lastCommit}${r.best.epic !== r.explicit ? `; LSI prefers \`${short(r.best.epic)}\` (${r.best.cosine.toFixed(2)})` : "; LSI agrees"}`));
  section("Unmerged branches with no bean named — latent home", latentOnly.sort((a, b) => (a.lastCommit! < b.lastCommit! ? 1 : -1)), (r) =>
    fmtRow(r, `${r.pr ? `**PR #${r.pr}**; ` : ""}${r.best.cosine < FIT_FLOOR ? "**no fit**; " : r.margin < MARGIN_FLOOR ? `ambiguous vs \`${short(r.second?.epic)}\`; ` : ""}${r.ahead} ahead, last ${r.lastCommit}`));

  // `LSI_DUMP=<file>`: per-bean agreement, so two methods can be compared
  // PAIRED on the same beans (McNemar) rather than by two marginal rates.
  if (process.env.LSI_DUMP)
    writeFileSync(process.env.LSI_DUMP, JSON.stringify(Object.fromEntries(filed.map((r) => [r.key, r.best.epic === r.current]))));
  const report = lines.join("\n") + "\n";
  if (out) writeFileSync(resolve(out), report);
  else process.stdout.write(report);
  console.error(`beans: ${beanRows.length} open (${counts.unfiled} unfiled, ${counts.agree}/${counts.filed} agree, ${counts.disagree} disputed); branches: ${branchRows.length} unmerged (${withExplicit.length} explicit, ${latentOnly.length} latent)`);
}
