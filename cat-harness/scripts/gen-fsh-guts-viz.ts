#!/usr/bin/env bun
/**
 * Render the `fsh-guts` graph — the trashcan that is kept.
 *
 * @module cat-harness/scripts/gen-fsh-guts-viz
 *
 * ## Why this exists, and why the page is not published
 *
 * The owner asked to see it (*"i eant to see beans/ todos/ fsh-guts/"*,
 * 2026-09-21). Its own declaration says the opposite, as a design decision
 * rather than an oversight: *"DELIBERATELY absent from the rendered site …
 * this one's contents could be rendered and are not, so that something can be
 * kept without being published."*
 *
 * Both were wanted, so the owner ruled: **render it, exclude it from the
 * canonical deploy.** The page is therefore declared `publish: "staging-only"`
 * and `compose-docs.ts` withholds it unless told `--staging`. A reader here,
 * or of a `STAGING/<slug>/` preview, gets the page; a reader of the published
 * site does not meet it.
 *
 * ## It indexes, it does not republish
 *
 * Each entry links to the file on GitHub rather than inlining it. That keeps
 * the page an INDEX of what is kept, which is what "see it" asked for, without
 * copying deprecated content into a second location that then has to be kept
 * in step. The graph stays the one copy; this is a way in.
 *
 * ## The third state is the point
 *
 * The declaration says *"Files declare themselves with
 * `$schema: folio-fsh-guts/v1`, per the same contract the bean and workflow
 * stores use."* Measured, that contract is honoured by most of the corpus and
 * not all of it, and the gap decomposes rather than being one number:
 *
 * - a file carrying the tag is **declared**;
 * - a `.py`/`.ts` script cannot carry YAML front matter at all, so when a
 *   tagged `.md` sibling describes it, it is **described by sidecar** — the
 *   contract met by the only mechanism open to it;
 * - anything else is **undeclared**, and that is a finding.
 *
 * Collapsing those into "tagged / untagged" would file a script that cannot
 * structurally comply beside a markdown file that simply omitted the line,
 * and the second is somebody's omission while the first is the format's.
 * `unknown` is never rendered as clean here for the same reason it is not
 * anywhere else in this repository.
 *
 * Usage:
 *   bun run cat-harness/scripts/gen-fsh-guts-viz.ts
 *   bun run cat-harness/scripts/gen-fsh-guts-viz.ts --check
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { declarationPathIn } from "../schemas/cat-harness.js";
import { docsLayers } from "./compose-docs.js";

const REPO = resolve(import.meta.dir, "..", "..");
const TAG = "folio-fsh-guts/v1";
/** The graph kind this renders — the one literal, and it is a KIND, not a path. */
const KIND = "fsh-guts";

/** How a file meets — or fails — the graph's self-declaration contract. */
export type DeclState = "declared" | "sidecar" | "undeclared";

export interface GutsFile {
  /** Path relative to the graph's own directory. */
  readonly rel: string;
  /** Top-level directory under the graph — `proposals`, `retired`, `scripts`. */
  readonly group: string;
  readonly state: DeclState;
  /** The file's own title, where it has one. */
  readonly title?: string;
}

/**
 * The graph's directory, READ FROM THE DECLARATION.
 *
 * Not `join(REPO, "fsh-guts")`. The path is declared, it is `repository`
 * scoped, and a literal here is the `check:declared-assets` shape — a
 * generator that keeps working after the directory moves, over nothing.
 */
export function gutsDir(repo = REPO): string | undefined {
  const declPath = declarationPathIn(join(repo, "cat-harness"));
  if (!declPath || !existsSync(declPath)) return undefined;
  const d = JSON.parse(readFileSync(declPath, "utf-8")) as {
    directories?: { id?: string; path?: string; scope?: string; graphKinds?: string[] }[];
  };
  for (const e of d.directories ?? []) {
    if (!e.path || !(e.graphKinds ?? []).includes(KIND)) continue;
    return join(e.scope === "repository" ? repo : join(repo, "cat-harness"), e.path);
  }
  return undefined;
}

/**
 * Where the page goes, READ FROM THE SAME DECLARATION that renders it.
 *
 * The visualiser ref IS the page's location — `compose-docs.ts` withholds
 * exactly that path on a canonical build — so a literal here would let the
 * generator write one file while the withholding protected another. The two
 * would disagree silently and the failure mode is publishing the page this
 * whole change exists to withhold.
 *
 * Returned relative to the base docs layer, which is where a generated page
 * belongs and what the ref is expressed against.
 */
export function pageRelPath(repo = REPO): string | undefined {
  const declPath = declarationPathIn(join(repo, "cat-harness"));
  if (!declPath || !existsSync(declPath)) return undefined;
  const d = JSON.parse(readFileSync(declPath, "utf-8")) as {
    directories?: { graphKinds?: string[]; coverage?: { visualiser?: unknown } }[];
  };
  for (const e of d.directories ?? []) {
    if (!(e.graphKinds ?? []).includes(KIND)) continue;
    const v = e.coverage?.visualiser;
    for (const one of Array.isArray(v) ? v : [v]) {
      const ref = typeof one === "string" ? one : (one as { ref?: string } | undefined)?.ref;
      if (!ref) continue;
      const rel = relative(baseDocs(repo), resolve(repo, ref));
      // Outside the base docs layer is not a page this generator may write.
      if (rel.startsWith("..") || rel === "") return undefined;
      return rel;
    }
  }
  return undefined;
}

/** Every file under `dir`, relative, sorted, dotfiles skipped. */
function walk(dir: string, prefix = ""): string[] {
  const out: string[] = [];
  for (const e of readdirSync(join(dir, prefix), { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(dir, rel));
    else out.push(rel);
  }
  return out.sort();
}

/** A file's first markdown heading, where it has one. */
function titleOf(abs: string): string | undefined {
  let text: string;
  try {
    text = readFileSync(abs, "utf-8");
  } catch {
    return undefined;
  }
  const m = /^#\s+(.+)$/m.exec(text);
  return m?.[1]?.trim();
}

/**
 * Read the corpus and classify every file.
 *
 * Exported so the classification is unit-testable without the page: the
 * `sidecar` state is the part most easily got wrong, and a test that went
 * through the rendered markdown would be testing the table renderer.
 */
export function gutsFiles(dir: string): GutsFile[] {
  const rels = walk(dir);
  const tagged = new Set(
    rels.filter((r) => {
      try {
        return readFileSync(join(dir, r), "utf-8").includes(TAG);
      } catch {
        return false;
      }
    }),
  );
  return rels.map((rel) => {
    const slash = rel.lastIndexOf("/");
    const group = slash === -1 ? "." : rel.slice(0, rel.indexOf("/"));
    let state: DeclState = "undeclared";
    if (tagged.has(rel)) state = "declared";
    else if (/\.(py|ts|sh)$/.test(rel) && tagged.has(rel.replace(/\.[^.]+$/, ".md"))) state = "sidecar";
    const title = titleOf(join(dir, rel));
    return { rel, group, state, ...(title ? { title } : {}) };
  });
}

const BADGE: Record<DeclState, string> = {
  declared: '<span class="fg-tag fg-ok">declared</span>',
  sidecar: '<span class="fg-tag fg-side">via sidecar</span>',
  undeclared: '<span class="fg-tag fg-gap">undeclared</span>',
};

const CSS = `
.fg-tag{display:inline-block;padding:.05rem .4rem;border-radius:3px;font-size:.75rem;
  font-weight:600;white-space:nowrap;border:1px solid currentColor}
.fg-ok{color:#0d6e5e}
.fg-side{color:#6b5b95}
.fg-gap{color:#a8430f}
`;

/** Escape a cell so a filename containing a pipe cannot break the table. */
function cell(v: string): string {
  return v.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export function page(files: GutsFile[], blobBase: string): string {
  const counts: Record<DeclState, number> = { declared: 0, sidecar: 0, undeclared: 0 };
  for (const f of files) counts[f.state]++;
  const groups = [...new Set(files.map((f) => f.group))].sort();

  const body: string[] = [
    "---",
    'title: "fsh-guts — the trashcan that is kept"',
    'description: "Deprecated and throwaway structured content, kept rather than deleted. Not published to the canonical site."',
    "---",
    `<style>${CSS}</style>`,
    "",
    "This page is **not on the published site**. It is declared",
    "`publish: \"staging-only\"`, so `compose-docs.ts` withholds it from the canonical",
    "deploy and includes it in a local build or a `STAGING/<slug>/` preview.",
    "",
    "`fsh-guts` holds content that was **relocated rather than deleted**. The rule",
    "it makes enforceable is the one `AGENTS.md` states for beans and means",
    "generally: a scrapped item stops the next agent re-entering a dead end, while",
    "a deleted one cannot be told from an accident. Delete here means relocate, and",
    "relocate is reversible.",
    "",
    `**${files.length} file(s)** across ${groups.length} group(s). Each links to the file itself —`,
    "this page indexes what is kept, it does not republish it.",
    "",
    "## Does each file declare itself?",
    "",
    `The graph's declaration says files carry \`$schema: ${TAG}\`. Three states,`,
    "kept apart on purpose: a `.py` or `.ts` script **cannot** carry YAML front",
    "matter, so a tagged `.md` sibling is the contract met by the only mechanism",
    "open to it. Filing that beside a markdown file that simply omitted the line",
    "would make the format's limit and somebody's omission look the same.",
    "",
    "| state | files | what it means |",
    "|---|---|---|",
    `| ${BADGE.declared} | ${counts.declared} | carries the tag itself |`,
    `| ${BADGE.sidecar} | ${counts.sidecar} | a script, described by a tagged \`.md\` sibling |`,
    `| ${BADGE.undeclared} | ${counts.undeclared} | **neither** — a gap, not a format limit |`,
    "",
  ];

  if (counts.undeclared > 0) {
    body.push(
      `The ${counts.undeclared} undeclared are listed below with the rest rather than in a`,
      "separate section: they are part of the corpus, and a gap hidden behind a",
      "summary count is the failure this table exists to avoid.",
      "",
    );
  }

  for (const g of groups) {
    const inGroup = files.filter((f) => f.group === g);
    body.push(`## ${g === "." ? "at the root" : g}`, "", `${inGroup.length} file(s).`, "");
    body.push("| file | what it is | declares itself |", "|---|---|---|");
    for (const f of inGroup) {
      const name = f.rel.slice(f.group === "." ? 0 : f.group.length + 1);
      body.push(
        `| [${cell(name)}](${blobBase}/${f.rel}) | ${cell(f.title ?? "—")} | ${BADGE[f.state]} |`,
      );
    }
    body.push("");
  }
  return body.join("\n").trimEnd() + "\n";
}

/**
 * The base docs layer — the SAME answer `compose-docs.ts` uses, not a literal.
 *
 * `site-dir-single-answer.test.ts` refuses a hardcoded site root here and is
 * right to: the root has moved twice (beans `x4a6`, `wggr`), and a generator
 * holding its own copy keeps writing where the site used to be while every
 * check reports clean.
 *
 * `docsLayers()` rather than `siteDirFor()`, and the difference bit once
 * already: `siteDirFor` answers RELATIVE TO AN INSTANCE (`"docs"`), so
 * `join(repo, siteDirFor(...))` resolves to the repository's OVERLAY layer
 * rather than to `cat-harness`'s base. `docsLayers` reads both from the
 * declaration and marks which is which, so asking it is the one answer —
 * and it is the same one the composer withholds against.
 */
function baseDocs(repo: string): string {
  const base = docsLayers(repo).layers.find((l) => !l.repositoryScoped);
  if (base === undefined) throw new Error("no instance-scoped docs layer is declared");
  return base.dir;
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const dir = gutsDir();
  if (dir === undefined || !existsSync(dir)) {
    // A declared graph with no directory is the `dh4f` shape: scanning nothing
    // and reporting a clean run. Refuse rather than write an empty page.
    console.error("::error::gen-fsh-guts-viz: no directory declared for graph kind 'fsh-guts'");
    process.exit(1);
  }
  const files = gutsFiles(dir);
  if (files.length === 0) {
    console.error(`::error::gen-fsh-guts-viz: ${relative(REPO, dir)} is empty — nothing to render`);
    process.exit(1);
  }
  const blobBase = `https://github.com/litlfred/folio-assistant/blob/main/${relative(REPO, dir)}`;
  const rendered = page(files, blobBase);
  const PAGE = pageRelPath(REPO);
  if (PAGE === undefined) {
    // No declared visualiser means no withholding either, so writing a page
    // here would publish it. Refuse rather than choose a path.
    console.error(`::error::gen-fsh-guts-viz: no visualiser declared for graph kind '${KIND}'`);
    process.exit(1);
  }
  const out = join(baseDocs(REPO), PAGE);

  if (check) {
    const current = existsSync(out) ? readFileSync(out, "utf-8") : "";
    if (current !== rendered) {
      console.error(`::error::gen-fsh-guts-viz: ${PAGE} is stale — run \`bun run fsh-guts:viz\``);
      process.exit(1);
    }
    console.log(`✓ fsh-guts viewer is current — ${files.length} file(s)`);
  } else {
    mkdirSync(join(out, ".."), { recursive: true });
    writeFileSync(out, rendered);
    const n = files.filter((f) => f.state === "undeclared").length;
    console.log(`fsh-guts viewer: ${files.length} file(s) → ${PAGE}`);
    console.log(n === 0 ? "  every file declares itself" : `  ${n} undeclared — shown as such on the page`);
  }
}
