#!/usr/bin/env bun
/**
 * A path a declaration could have answered is not written down in code.
 *
 * ## The defect
 *
 * `harness.json` says where this instance's graphs live. Nine production
 * sites nevertheless hardcoded `skills/workflows`, so a topical split — the
 * whole point of the declaration — would have been a nine-file edit.
 * `workflowDirs()` fixed those nine, and then a sweep found **four more** the
 * working list had missed (`check-workflow-policy`, `check-workflow-refs`,
 * `gen-docs-pages`, a `kg-audit` leftover). That is the argument for a gate
 * rather than for a longer list: the sites nobody remembered are exactly the
 * ones a list omits.
 *
 * ## The rule, and where it comes from
 *
 * The owner's concession on 2026-09-19 — *"if need to hardcode json/jsonld
 * assets, thats ok. not preferrred"* — settles it. Hardcoding is permitted and
 * discouraged, which means it must be **declared and checked**, not forbidden
 * and not free. So a literal naming a declared directory is allowed when:
 *
 *  - **it names a FILE that exists.** Authored prose naming one specific
 *    artefact — `source: "skills/workflows/crdm-requirements.bpmn"` in a docs
 *    page — is not discovery and no declaration would answer it. Eighteen of
 *    these are correct and must stay. They are **checked to resolve**, which
 *    closes the `blv9` defect class (a link-shaped value that does not
 *    dereference) over the same corpus for free.
 *  - **it carries `declared-path-literal: <reason>`** in a comment on its own
 *    line or the line above. The base cases are here: the module that supplies
 *    the defaults, the scaffolder that CREATES the layout, the partition plan
 *    that describes a layout this repo does not have yet. Same shape as
 *    `<folio:no-skill reason="…"/>`: exempt, but the reason is required, so
 *    silencing the check costs more than satisfying it, and the marked sites
 *    are COUNTED in the summary rather than disappearing.
 *
 * Everything else — a literal naming a declared DIRECTORY, or naming nothing
 * that resolves — is refused, with the helper that answers it named.
 *
 * ## What it does not look at
 *
 * Comments, because a path in prose is documentation and this repo's own
 * doc blocks are full of them; and placeholders (`${…}`, `<locale>`), because
 * a template is not a path a declaration could have answered without also
 * answering the placeholder.
 *
 * ## Why it ships as a ratchet and not as a wall
 *
 * First run, 2026-09-19: **152** unaccounted literals across 40 files. That
 * is the finding — the debt is an order of magnitude past the nine sites the
 * `workflowDirs()` rewire knew about — and it is also why a blocking gate
 * cannot land today. Some of those sites need real design (`LOCAL_PACKAGES`
 * in `skill-fetch.ts` is a package→directory map, not a lookup), and a gate
 * that fails 152 times on the day it arrives is a gate somebody switches off.
 * `check-corpus-gate.ts` has `--warn` for the same reason.
 *
 * So the baseline is COMMITTED, **per file rather than per line** — a count
 * churns under an unrelated edit far less than a line number does — and a
 * file may only ever lose literals. A new hardcode in a file that had none
 * fails immediately, which is the case this gate exists for; the 152 are
 * recorded debt that is visible in one number and can only go down.
 * `--update` rewrites it, and raising a count is printed loudly and shows up
 * as a diff somebody reviews, the same contract a lockfile has.
 *
 * Usage:  bun run check:declared-paths  [--update]
 * Exit:   0 at or under baseline · 1 above it, or a marked literal naming nothing
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { resolveDirectories } from "../schemas/cat-harness.js";

const root = resolve(import.meta.dir, "..");
const update = process.argv.includes("--update");
const BASELINE = join(root, "scripts", "declared-path-baseline.json");

/**
 * The declared directories, as repo-relative prefixes.
 *
 * Read, never listed — a gate against hardcoded declared paths that hardcoded
 * the declared paths would be the joke that writes itself.
 */
function declaredPrefixes(root: string): string[] {
  return resolveDirectories([{ name: "(local)", root, own: true }])
    .map((d) => d.path.replace(/\/+$/, ""))
    .filter((p) => p.length > 0)
    .sort((a, b) => b.length - a.length);
}

/**
 * Which helper answers a prefix, so a finding says what to do rather than
 * only what is wrong. Absent means "read the declaration" with no shorthand.
 */
const HELPERS: Record<string, string> = {
  skills: "skillMdDirs() / workflowDirs() / workflowFiles() in scripts/known-skills.ts",
  schemas: "resolveDirectories() in schemas/cat-harness.ts",
};

/** Source trees this instance authors. Generated output is not code. */
const SOURCE_DIRS = ["src", "scripts", "schemas", "content", "tools", "adapters", "simulators", "computations"];

const MARKER = /declared-path-literal:\s*\S/;

/**
 * Which lines a marker covers: its own, and everything down to the next
 * blank line.
 *
 * "The line above" alone was tried first and is too tight to be usable — it
 * covers `write("beans/.gitkeep", "")` and not `DEFAULT_DIRECTORIES`, whose
 * eight entries sit on eight lines under one comment. Marking each entry
 * separately would put the same sentence in the file eight times, which is
 * the duplication this whole gate is about.
 *
 * A blank line is the boundary rather than a brace or an indent because it is
 * the one a reader already sees. The cost is that a marker can cover more
 * than its author meant; the marked literals are PRINTED with their reason on
 * every run, so an over-broad marker is visible rather than silent.
 */
function markerCoverage(rawLines: string[]): Map<number, string> {
  const cover = new Map<number, string>();
  for (let n = 0; n < rawLines.length; n++) {
    if (!MARKER.test(rawLines[n]!)) continue;
    // The reason runs on into the comment lines below it — a one-line reason
    // is rarely the whole of one, and a truncated reason in the summary is
    // exactly as unhelpful as no reason.
    const parts = [/declared-path-literal:\s*(.+?)\s*(?:\*\/)?$/.exec(rawLines[n]!)?.[1] ?? ""];
    for (let m = n + 1; m < rawLines.length; m++) {
      const c = /^\s*(?:\/\/|\*)\s?(.*)$/.exec(rawLines[m]!);
      if (c === null || MARKER.test(rawLines[m]!)) break;
      parts.push(c[1]!.replace(/\s*\*\/\s*$/, "").trim());
    }
    const reason = parts.join(" ").replace(/\s+/g, " ").trim();
    for (let m = n; m < rawLines.length; m++) {
      if (rawLines[m]!.trim() === "") break;
      if (!cover.has(m)) cover.set(m, reason);
    }
  }
  return cover;
}

/**
 * Blank out comments, so a path in a doc block is not read as code.
 *
 * Runs before the literal scan for the same reason `ns-export`'s scanner
 * does: that one matched its own documentation and reported a phantom term.
 * Replaces with spaces rather than deleting, so line and column survive.
 */
function stripComments(text: string): string {
  let out = "";
  let i = 0;
  let mode: "code" | "line" | "block" | "s" | "d" | "t" = "code";
  while (i < text.length) {
    const c = text[i]!;
    const two = text.slice(i, i + 2);
    if (mode === "code") {
      if (two === "//") { mode = "line"; out += "  "; i += 2; continue; }
      if (two === "/*") { mode = "block"; out += "  "; i += 2; continue; }
      if (c === "'") mode = "s";
      else if (c === '"') mode = "d";
      else if (c === "`") mode = "t";
      out += c; i++; continue;
    }
    if (mode === "line") {
      if (c === "\n") { mode = "code"; out += c; } else out += " ";
      i++; continue;
    }
    if (mode === "block") {
      if (two === "*/") { mode = "code"; out += "  "; i += 2; continue; }
      out += c === "\n" ? c : " "; i++; continue;
    }
    // inside a string: copy verbatim, honouring escapes
    if (c === "\\") { out += text.slice(i, i + 2); i += 2; continue; }
    if ((mode === "s" && c === "'") || (mode === "d" && c === '"') || (mode === "t" && c === "`")) mode = "code";
    out += c; i++;
  }
  return out;
}

/**
 * Offsets of every string literal sitting inside a path-building call.
 *
 * ## Why context and not shape alone
 *
 * A literal containing `/` is a path whatever surrounds it. A BARE segment is
 * not: `join(root, "skills", "workflows")` is the nine-site defect this gate
 * exists for, and `{ id: "beans", module: … }` in `server.ts` is a tool-group
 * identifier that happens to spell a declared directory. Refusing both would
 * put ~100 identifiers in the findings, and `known-skills.ts`'s own header
 * says why that is fatal: *"a check that cries wolf is a check somebody
 * switches off"*.
 *
 * So a bare segment counts only where the code is demonstrably building a
 * path with it. Nesting is tracked, so `join(a, join(b, "skills"))` is caught
 * at the inner call.
 */
function pathContextRanges(code: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const call = /\b(?:join|joinPath|resolve|relative)\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = call.exec(code)) !== null) {
    let depth = 1;
    let i = m.index + m[0].length;
    const start = i;
    while (i < code.length && depth > 0) {
      const c = code[i]!;
      if (c === "(") depth++;
      else if (c === ")") depth--;
      i++;
    }
    out.push([start, i]);
  }
  return out;
}

export interface Site { file: string; line: number; literal: string; prefix: string }
export interface Scan {
  prefixes: string[];
  /** Names a file that exists — authored prose, checked to dereference. */
  artefacts: Site[];
  /** Carries `declared-path-literal: <reason>`. */
  marked: Array<Site & { reason: string }>;
  /** Neither — the debt. */
  refused: Array<Site & { why: string }>;
}

const LITERAL = /(["'`])((?:[^\\\n]|\\.)*?)\1/g;

/**
 * Every declared-path literal in the instance's own source, classified.
 *
 * Exported so `scripts/tests/declared-paths.test.ts` asserts the property
 * rather than shelling out to the CLI and reading its exit code — the pattern
 * `activity-skill-coverage.test.ts` set, and for its reason: a test that
 * parses console output breaks on a wording change and proves nothing about
 * the data.
 */
export function scanDeclaredPaths(root: string): Scan {
  const prefixes = declaredPrefixes(root);
  const refused: Scan["refused"] = [];
  const artefacts: Site[] = [];
  const marked: Scan["marked"] = [];

  const scan = (file: string): void => {
  const raw = readFileSync(file, "utf-8");
  const rawLines = raw.split("\n");
  const code = stripComments(raw);
  const lines = code.split("\n");
  const cover = markerCoverage(rawLines);
  const ranges = pathContextRanges(code);
  // Offset of each line's first character, so a literal's position in the
  // line maps back to a position in the file the ranges are measured in.
  const lineStart: number[] = [];
  { let acc = 0; for (const l of lines) { lineStart.push(acc); acc += l.length + 1; } }

  for (let n = 0; n < lines.length; n++) {
    const line = lines[n]!;
    LITERAL.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = LITERAL.exec(line)) !== null) {
      const value = m[2]!;
      const prefix = prefixes.find((p) => value === p || value.startsWith(`${p}/`));
      if (prefix === undefined) continue;
      // A bare declared segment is a path only where the code builds one
      // with it; a literal carrying a separator is a path on its face.
      if (!value.includes("/")) {
        const at = lineStart[n]! + m.index;
        if (!ranges.some(([a, b]) => at >= a && at < b)) continue;
      }
      const site: Site = { file: relative(root, file), line: n + 1, literal: value, prefix };

      // A template is not a path. `translations/${loc}/x.pot` and
      // `translations/<locale>/<name>.pot` name a SHAPE, and no declaration
      // answers the placeholder either.
      if (/[$<]/.test(value)) continue;

      // Read from the RAW text: the marker lives in a comment, which the
      // scan above has blanked out by design.
      const reason = cover.get(n);
      if (reason !== undefined) {
        marked.push({ ...site, reason });
        continue;
      }

      const abs = join(root, value);
      if (!existsSync(abs)) {
        refused.push({ ...site, why: "names nothing that resolves" });
        continue;
      }
      if (statSync(abs).isDirectory()) {
        refused.push({ ...site, why: "a DIRECTORY the declaration already answers" });
        continue;
      }
      artefacts.push(site);
    }
  }
}

  const walk = (dir: string): void => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".ts") && !e.name.endsWith(".test.ts")) scan(p);
    }
  };

  for (const d of SOURCE_DIRS) walk(join(root, d));
  return { prefixes, artefacts, marked, refused };
}

if (import.meta.main) {
  const { prefixes, artefacts, marked, refused } = scanDeclaredPaths(root);

  interface Baseline { _comment: string; files: Record<string, number> }

  const prior: Baseline = existsSync(BASELINE)
    ? (JSON.parse(readFileSync(BASELINE, "utf-8")) as Baseline)
    : { _comment: "", files: {} };

  const current: Record<string, number> = {};
  for (const r of refused) current[r.file] = (current[r.file] ?? 0) + 1;

  const over: Array<{ file: string; was: number; now: number }> = [];
  for (const [file, n] of Object.entries(current)) {
    const was = prior.files[file] ?? 0;
    if (n > was) over.push({ file, was, now: n });
  }
  const improved: Array<{ file: string; was: number; now: number }> = [];
  for (const [file, was] of Object.entries(prior.files)) {
    const now = current[file] ?? 0;
    if (now < was) improved.push({ file, was, now });
  }

  const priorTotal = Object.values(prior.files).reduce((a, b) => a + b, 0);

  console.log(
    `Declared-path literals  (${prefixes.length} declared prefixes, ` +
      `${artefacts.length + marked.length + refused.length} literals found)\n`,
  );

  console.log(`  ✓ ${String(artefacts.length).padStart(3)}  name a file that exists — checked to resolve`);
  console.log(`  · ${String(marked.length).padStart(3)}  declared base cases, each with a reason`);
  console.log(
    `  ${over.length ? "✗" : "·"} ${String(refused.length).padStart(3)}  ` +
      `unaccounted for — baseline ${priorTotal}${refused.length === priorTotal ? "" : ` (was ${priorTotal})`}`,
  );

  if (marked.length) {
    console.log("\nDECLARED base cases — permitted, and counted so they stay visible:");
    for (const m of marked) console.log(`  · ${m.file}:${m.line}  "${m.literal}"\n      ${m.reason}`);
  }

  if (improved.length) {
    console.log("\nIMPROVED — fewer than the baseline records. Re-run with --update:");
    for (const i of improved) console.log(`  ✓ ${i.file.padEnd(46)} ${i.was} → ${i.now}`);
  }

  if (over.length) {
    console.log("\nABOVE BASELINE — a declaration answers this, or nothing does:");
    for (const o of over) {
      console.log(`  ✗ ${o.file}  ${o.was} → ${o.now}`);
      for (const r of refused.filter((r) => r.file === o.file)) {
        console.log(`      line ${r.line}: "${r.literal}" — ${r.why}`);
        const helper = HELPERS[r.prefix];
        if (helper !== undefined) console.log(`        ask: ${helper}`);
      }
    }
  }

  if (update) {
    const next: Baseline = {
      _comment:
        "Per-file counts of declared-path literals that neither resolve to a file " +
        "nor carry a `declared-path-literal: <reason>` marker. WRITTEN by " +
        "`bun run check:declared-paths --update`; a count may only go DOWN. This is " +
        "recorded debt, not a list of exemptions: each entry is a place where code " +
        "hardcodes a path `harness.json` already declares. See the module header of " +
        "scripts/check-declared-paths.ts for why it ships as a ratchet.",
      files: Object.fromEntries(Object.entries(current).sort(([a], [b]) => a.localeCompare(b))),
    };
    writeFileSync(BASELINE, `${JSON.stringify(next, null, 2)}\n`);
    console.log(`\nBaseline written: ${relative(root, BASELINE)} (${refused.length} across ${Object.keys(current).length} files)`);
    if (over.length) console.log("RAISED for the files above — that belongs in the diff somebody reviews.");
    process.exit(0);
  }

  if (over.length) {
    console.log(
      `\n${over.length} file(s) gained a declared-path literal. Either read the\n` +
        `declaration, or mark the site \`declared-path-literal: <why this one cannot\n` +
        `be read>\` — the reason is required, and marked sites are counted above\n` +
        `rather than disappearing.`,
    );
    process.exit(1);
  }

  console.log("\nNo file gained a declared-path literal.");

}
