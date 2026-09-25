#!/usr/bin/env bun
/**
 * A name that claims an anchor must land on it.
 *
 * Bean `b963`, the `re-rooted-ascent` shape. The defect: `const PLATFORM = resolve(
 * import.meta.dir, "../..")` in `init-folio.test.ts` was the repository root
 * while the tests lived at `scripts/tests/`, and silently became the
 * `cat-harness/` directory when they moved. **The suite went on passing** — by
 * modelling a layout that no longer existed, and so asserting that the
 * scaffolder should keep emitting the pre-split paths.
 *
 * The shapes are NAMED rather than numbered, in `b963`'s register. The
 * ordinals collided: `b963` numbered shapes in discovery order while `7iog`
 * numbered the readers `check:command-paths` had, and both were counts in
 * prose. `7iog`'s shape is `execution-context` — a PEER rather than a later
 * instalment, because every `b963` shape is *the literal is stale* and that
 * one is *the literal is fine and the frame is wrong*.
 *
 * ## This check does NOT catch that defect, and says so
 *
 * Three designs were measured against this corpus and all three failed:
 *
 * | signal | findings | why it failed |
 * |---|---|---|
 * | refuse hand-rolled ascents | 301 | most ARE the idiom; unimplementable |
 * | lands on a non-existent directory | 8 | 7 were ordinary write targets |
 * | the ascent's depth is "wrong" | — | **no literal to check**: `"../.."` is always valid, and the right depth is a fact about where the file sits |
 *
 * What made the real case wrong was not the ascent or its depth. `PLATFORM`
 * → `cat-harness/` is defensible. It was what the fixture then DID with the
 * value: symlinked it as `folio-assistant` and expected `schemas/` directly
 * beneath. That is a semantic relation between an ascent and its downstream
 * use, and every signal that tried to infer intent produced false positives.
 *
 * ## What it does instead: remove the ambiguity the defect hid behind
 *
 * A reader of `PLATFORM` cannot tell which directory it holds — and **measured
 * on this corpus, neither can the corpus**: within `scripts/tests/` alone,
 * `init-folio.test.ts` used `PLATFORM` for the repository root while five
 * siblings used it for `cat-harness/`. One name, two anchors, one directory.
 * That is exactly the confusion the original defect lived inside.
 *
 * So the rule is definitional rather than a guess, which is why it has no
 * false positives:
 *
 * > **`REPO_ROOT`, `REPO`, `repoRoot` must land on the repository root.
 * > `INSTANCE_ROOT`, `instanceRoot` must land on a directory carrying its own
 * > `harness.json`. `PLATFORM` and `platformRoot` name neither and are
 * > refused** — rename to whichever is meant.
 *
 * The repository root is found by walking up to `.git`, and an instance by its
 * `harness.json`, so neither anchor is a literal this check could get wrong in
 * the same way the code it audits did.
 *
 * ## What it is worth
 *
 * Names become trustworthy. That is worth something on its own — a reader of
 * `gen-skill-docs.ts` currently sees `REPO_ROOT` feeding `kgDirectories()`,
 * which takes an INSTANCE root, and has to read the callee to find out which
 * is true. It is also the precondition for ever building the check that would
 * catch the real defect: comparing an ascent against its downstream use is
 * hopeless while the name carries no information.
 *
 * Exit: 0 clean, 1 a mismatched or ambiguous name, 2 could not check.
 *
 * @module folio-assistant/scripts/check-anchor-names
 * @covers docs
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { findDeclarationFile, repoRootFor } from "../schemas/cat-harness.js";

/** The INSTANCE root — this file lives at `<instance>/scripts/`. */
export const INSTANCE_ROOT = resolve(import.meta.dir, "..");

/** Names that claim the repository root. */
export const REPO_NAMES = /^(REPO_ROOT|REPO|repoRoot)$/;
/** Names that claim an instance root — a directory with its own `harness.json`. */
export const INSTANCE_NAMES = /^(INSTANCE_ROOT|instanceRoot)$/;
/**
 * Names that claim neither, and are refused for it.
 *
 * "Platform" means the repository to a folio linking it as a submodule, and
 * the `cat-harness/` code root to everything inside it. Both readings are in
 * use HERE, in one directory of tests, which is the whole argument: a name
 * that needs the reader to know which is meant carries no information.
 */
export const AMBIGUOUS_NAMES = /^(PLATFORM|platformRoot|platformDir)$/;

/** `const NAME = resolve(import.meta.dir, "..", "..")` and its `join`/`__dirname` spellings. */
const ASCENT =
  /(?:const|let)\s+(\w+)\s*=\s*(?:resolve|join)\(\s*(?:import\.meta\.dir|__dirname)\s*,\s*([^)]*)\)/g;

/**
 * Is this match inside a string literal rather than being code?
 *
 * **This check's own test file is why.** Its fixtures embed sample ascents as
 * strings — `'const REPO_ROOT = resolve(import.meta.dir, "..", "..");'` — and
 * the first run reported three findings against them. A check that cannot
 * tell code from a quoted example of code will be reported to by every test
 * that exercises it, which is the fastest route to somebody deleting it.
 *
 * Counted rather than parsed: an odd number of unescaped quotes of one kind
 * before the match, on that line, means the match sits inside one. That is
 * enough here because an ascent declaration fits on a line; a real parser
 * would be a heavier dependency for no gain this check can use.
 */
function insideStringLiteral(line: string, at: number): boolean {
  for (const q of ["'", '"', "`"]) {
    let n = 0;
    for (let i = 0; i < at && i < line.length; i++) {
      if (line[i] === q && line[i - 1] !== "\\") n++;
    }
    if (n % 2 === 1) return true;
  }
  return false;
}

export interface AnchorFinding {
  file: string;
  name: string;
  lands: string;
  /** What the name claims, and what it actually got. */
  detail: string;
}

export interface AnchorReport {
  filesRead: number;
  ascents: number;
  findings: AnchorFinding[];
}

/** Directories carrying their own `harness.json` — an instance, by definition. */
export function instanceDirs(repo: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(repo)) {
    if (name.startsWith(".") || name === "node_modules") continue;
    try {
      if (statSync(join(repo, name)).isDirectory() && findDeclarationFile(join(repo, name)) !== undefined) out.push(name);
    } catch {
      /* unreadable entry: not an instance as far as this can tell */
    }
  }
  return out;
}

function walkTs(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkTs(p));
    else if (name.endsWith(".ts")) out.push(p);
  }
  return out;
}

export function checkAnchorNames(repo: string = repoRootFor(INSTANCE_ROOT)): AnchorReport {
  const report: AnchorReport = { filesRead: 0, ascents: 0, findings: [] };
  for (const inst of instanceDirs(repo)) {
    for (const file of walkTs(join(repo, inst))) {
      let src: string;
      try {
        src = readFileSync(file, "utf8");
      } catch {
        continue;
      }
      report.filesRead++;
      for (const m of src.matchAll(ASCENT)) {
        // A quoted example of an ascent is not an ascent — see above.
        const lineStart = src.lastIndexOf("\n", m.index ?? 0) + 1;
        const lineEnd = src.indexOf("\n", m.index ?? 0);
        const line = src.slice(lineStart, lineEnd < 0 ? undefined : lineEnd);
        if (insideStringLiteral(line, (m.index ?? 0) - lineStart)) continue;
        const name = m[1]!;
        const parts = [...m[2]!.matchAll(/"([^"]*)"/g)].map((x) => x[1]!);
        if (parts.length === 0) continue;
        report.ascents++;
        const lands = resolve(join(file, ".."), ...parts);
        const isRepo = lands === repo;
        const isInstance = findDeclarationFile(lands) !== undefined;
        const where = relative(repo, file);
        const to = relative(repo, lands) || ".";
        if (AMBIGUOUS_NAMES.test(name)) {
          report.findings.push({
            file: where,
            name,
            lands: to,
            detail:
              `\`${name}\` names neither anchor — "platform" is the REPOSITORY to a folio linking it ` +
              `and the code root to everything inside it, and both readings are in use here. ` +
              `It lands on \`${to}\`; rename it to ${isRepo ? "`REPO_ROOT`" : "`INSTANCE_ROOT`"}.`,
          });
        } else if (REPO_NAMES.test(name) && !isRepo) {
          report.findings.push({
            file: where,
            name,
            lands: to,
            detail:
              `\`${name}\` claims the repository root and lands on \`${to}\`` +
              `${isInstance ? ", which is an INSTANCE root — rename it to `INSTANCE_ROOT`" : ", which is neither anchor"}.`,
          });
        } else if (INSTANCE_NAMES.test(name) && !isInstance) {
          report.findings.push({
            file: where,
            name,
            lands: to,
            detail:
              `\`${name}\` claims an instance root and lands on \`${to}\`` +
              `${isRepo ? ", which is the REPOSITORY root — rename it to `REPO_ROOT`" : ", which carries no declaration"}.`,
          });
        }
      }
    }
  }
  return report;
}

function formatReport(r: AnchorReport): string {
  if (r.filesRead === 0) {
    return "Anchor names\n  ? EXAMINED NOTHING — no instance carried any TypeScript. Not a pass.";
  }
  const out = [`Anchor names (${r.filesRead} file(s), ${r.ascents} declared ascent(s))`];
  if (r.findings.length === 0) {
    out.push("  ✓ every name that claims an anchor lands on it");
    return out.join("\n");
  }
  for (const f of r.findings) out.push(`  ✗ ${f.file}\n      ${f.detail}`);
  out.push("");
  out.push("  This check does NOT catch a re-rooted ascent — see the module header for the three");
  out.push("  designs that were measured and failed. It removes the ambiguity that defect hid behind.");
  return out.join("\n");
}

if (import.meta.main) {
  let report: AnchorReport;
  try {
    report = checkAnchorNames();
  } catch (e) {
    console.error(`Could not check anchor names: ${e instanceof Error ? e.message : e}`);
    console.error("This is NOT a pass. Treat it as unknown.");
    process.exit(2);
  }
  console.log(process.argv.includes("--json") ? JSON.stringify(report, null, 2) : formatReport(report));
  process.exit(report.findings.length || report.filesRead === 0 ? 1 : 0);
}
