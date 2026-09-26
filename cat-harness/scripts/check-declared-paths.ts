#!/usr/bin/env bun
/**
 * A path a declaration could have answered is not written down in code.
 *
 * ## The defect
 *
 * `harness.json` says where this instance's graphs live. Nine production
 * sites nevertheless hardcoded `processes`, so a topical split — the
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
 *    artefact — `source: "processes/crdm-requirements.bpmn"` in a docs
 *    page — is not discovery and no declaration would answer it. Eighteen of
 *    these are correct and must stay. They are **checked to resolve**, which
 *    closes the `blv9` defect class (a link-shaped value that does not
 *    dereference) over the same corpus for free.
 *  - **it carries `declared-path-literal: <reason>`** in a comment on its own
 *    line or the line above. The base cases are here: the module that supplies
 *    the defaults, the scaffolder that CREATES the layout, the partition plan
 *    that describes a layout this repo does not have yet. Same shape as
 *    `<cat-harness.processes:no-skill reason="…"/>`: exempt, but the reason is required, so
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
 * ## Tests ARE scanned, and were not until 2026-09-20
 *
 * `*.test.ts` was skipped from this module's first commit. Read the history
 * and there is no reason recorded anywhere: not a comment on the clause, not
 * a line in a 71-line commit message that argues every other scoping decision
 * with measurements, not a mention in the section above that exists to list
 * exclusions. **It was written, never argued** — so it cost three breakages
 * (bean `dhol`) before anyone asked.
 *
 * The worst was not a test failing. `scripts/tests/log-writer.test.ts`
 * composed a path to a diagram that had moved, went ENOENT, and reported
 * *"the process does not declare folio:log"* — **a false finding about the
 * corpus**, from a test that was itself broken. A gate that reads the
 * declaration is the thing that catches that, and it was looking away.
 *
 * ### Why the obvious fix was wrong, and what replaced it
 *
 * Scanning tests adds **407** literals to 18. So the bean proposed narrowing
 * the exemption to FIXTURES — a literal inside a `mkdtemp` tree names nothing
 * in this repository and must not be resolved against the declaration.
 *
 * Measured 2026-09-20, that is under-resolved. The 443 test literals are four
 * populations, not two: fixture trees; **test VECTORS** (`check(["folio/paper/
 * ch/x.qa.json"])` — path-shaped data passed to the function under test, and
 * `"@id": "library/who-anc-2016/nodes/rec-007"`, which is an identifier and
 * not a path at all); layout ASSERTIONS pinning that the declaration yields
 * `src/skills`; and real corpus references. A line-local fixture heuristic
 * scored 161 of 407 and misfiled the rest.
 *
 * **No heuristic was needed, and neither did the count work.** The first
 * attempt put all 407 into the per-file baseline and relied on the ratchet:
 * a corpus literal that stops resolving raises its file above baseline. That
 * catches relocation, and it was still wrong, for a reason that showed up
 * within the hour — a sibling's `schemas/folio-dir.test.ts`, merged from main,
 * tripped the gate with **two literals that were both entirely correct**. A
 * test that builds a fixture tree names declared directories by necessity, so
 * counting tests fires on every new test. That is the *"a check that cries
 * wolf is a check somebody switches off"* failure this file names twice, and
 * arriving at it by a different route does not make it a different failure.
 *
 * So tests leave the count ratchet entirely — for a test, naming nothing is
 * the normal case and counting it is noise — and what governs them instead is
 * the **witness list** (`witnessesOf`, `resolves` in the baseline): the
 * literals that resolve TODAY, committed. The gate fires when a recorded
 * witness stops resolving, which is relocation and nothing else.
 *
 * That also closes the case a fixture heuristic provably cannot catch: a
 * literal that LOOKS like a fixture path today because the file it named was
 * moved yesterday. **96 literals are witnessed, 23 of them in tests** — among
 * them the CRDM diagrams in `bpmn-translate.test.ts` and
 * `editing-hci-validation.bpmn` in `corpus-gate.test.ts`.
 *
 * Falsified in both directions rather than assumed: renamed
 * `crdm-deliver.bpmn` and the gate named the lost witness and exited 1;
 * restored it and the gate went quiet; added a new test building a fixture
 * tree under `mkdtemp` and the gate stayed silent, which the count could not
 * do.
 *
 * **The source baseline did not move** — still 18 across 11 files. Scanning
 * tests cost no recorded debt at all; it bought 23 witnesses.
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
 *
 * @covers cat-harness
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
    .filter((d) => !isAddressedByPath(d))
    .map((d) => d.path.replace(/\/+$/, ""))
    .filter((p) => p.length > 0)
    .sort((a, b) => b.length - a.length);
}

/**
 * Is this directory one you address BY PATH on purpose, rather than one you
 * DISCOVER through the declaration?
 *
 * ## Why the distinction, and why it had to be drawn
 *
 * This gate's rule is in its header: *a path a declaration could have answered
 * is not written down in code*. Every prefix it guarded when it was written
 * was a graph whose access pattern is discovery — `workflowDirs()` answers
 * "where are the processes", so a literal `processes/` is a site that would
 * break under a topical split.
 *
 * **A declaration cannot answer "which script is the gate runner".** Code
 * directories are named by path deliberately: `package.json` and the CI
 * workflows invoke `cat-harness/scripts/*.ts` by name, which is precisely what
 * `check:ci-invocations` and `check:command-paths` exist to keep honest. There
 * is no helper to reach for, so the finding this gate would raise names no
 * remedy.
 *
 * ## Measured, 2026-09-22, bean `ylj7`
 *
 * Declaring the four code directories took this gate from 0 refusals to
 * **822**, against a recorded baseline of 38 — a twentyfold jump, in one
 * change, with not one of them a real instance of the defect the gate
 * describes. A baseline bump would have hidden that; it would also have raised
 * the bar under every prefix where the rule DOES apply, which is the failure
 * mode a shared baseline has.
 *
 * So the scope is narrowed at the premise instead. The rule is unchanged for
 * every kind it was written for.
 *
 * ## It is a property of the KIND, never of the path
 *
 * Keyed on `code`, not on the strings `src`/`scripts`. Matching on a path
 * would exempt any future directory that happened to be called `scripts/`,
 * including one holding a graph you genuinely discover — and it would stop
 * exempting this one the moment it moved, which is the same reason overrides
 * here match on an entry's `id` rather than its `path`.
 *
 * A directory holding `code` AND a discoverable kind is NOT exempt: the
 * discoverable half is the access pattern that needs guarding, and a directory
 * is a place to look that may hold more than one part of a graph.
 */
function isAddressedByPath(d: { graphKinds?: readonly string[] }): boolean {
  const kinds = d.graphKinds ?? [];
  return kinds.length > 0 && kinds.every((k) => k === "code");
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
 *
 * ## Quote state resets at every newline, and that is a deliberate bound
 *
 * This is not a TypeScript parser and must not pretend to be one. It does not
 * understand REGEX LITERALS, and a regex containing a quote —
 * `/^"POT-Creation-Date:.*$/m`, which is real code in `translate-bpmn.ts` —
 * looks exactly like an opening string. Carrying that state forward
 * desynchronised the scanner for **the whole rest of the file**: measured
 * 2026-09-19, it reported a `beans/` inside a `//` comment as live code and
 * would equally have hidden real literals after any such line.
 *
 * Resetting EVERY quote mode at the newline bounds the damage to the one line
 * that confused it. Measured three ways over this corpus on 2026-09-19:
 * carrying all state forward reported 125, resetting only `'` and `"` reported
 * 120, and resetting the backtick too reports 117. Fewer each time — so the
 * multi-line template literals this was written to protect were themselves a
 * source of desync, not a thing worth carrying state for. The residue in each
 * case was BOTH extra findings and hidden ones, and the hidden half is what
 * made the state worth giving up.
 */
function stripComments(text: string): string {
  let out = "";
  let i = 0;
  let mode: "code" | "line" | "block" | "s" | "d" | "t" = "code";
  while (i < text.length) {
    const c = text[i]!;
    const two = text.slice(i, i + 2);
    // A quote that never closed on its line was not a string — almost always
    // a regex literal or an apostrophe the scanner cannot tell from one.
    if (c === "\n" && mode !== "block" && mode !== "line") mode = "code";
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
 * not: `join(root, "processes")` is the nine-site defect this gate
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

export /**
 * Offset of the first string literal inside a path-building call, or -1.
 *
 * "First" is what makes a bare segment a DECLARED directory rather than a
 * word: only the segment directly under the root can be one.
 */
function firstLiteralIn(code: string, [a, b]: [number, number]): number {
  const re = /(["'`])(?:[^\\\n]|\\.)*?\1/g;
  re.lastIndex = a;
  const m = re.exec(code);
  return m !== null && m.index < b ? m.index : -1;
}

interface Site { file: string; line: number; literal: string; prefix: string }
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
      //
      // And only as the FIRST segment of that path. `join(root, "skills")` is
      // the declared knowledge graph; `join(repoRootFor(root), ".claude", "skills",
      // "roles")` is a Claude-harness directory that merely spells the same
      // word, and no declaration answers it. Measured 2026-09-19: of the
      // ~55 bare `"skills"` findings, most were the second kind — so without
      // this the check says "a declaration already answers this" about
      // directories where that is simply false, which is worse than a miss.
      // A checker that over-claims teaches people to disbelieve it.
      if (!value.includes("/")) {
        const at = lineStart[n]! + m.index;
        const range = ranges.find(([a, b]) => at >= a && at < b);
        if (range === undefined) continue;
        if (firstLiteralIn(code, range) !== at) continue;
      }
      const site: Site = { file: relative(root, file), line: n + 1, literal: value, prefix };

      // A template is not a path. `translations/${loc}/x.pot` and
      // `translations/<locale>/<name>.pot` name a SHAPE, and no declaration
      // answers the placeholder either.
      if (/[$<]/.test(value)) continue;

      // Neither is a SENTENCE that opens with one. Three literals in this
      // corpus do — `"library/ — source material somebody else wrote"`,
      // `"voices/milnor.json, 12 rules. Complements…"` and a QA message
      // naming `test/results/block-qa/` — and each is a description a human
      // reads, which no declaration would supply. A space is the
      // discriminator because no path in this corpus contains one; a real
      // path that did would be missed, and that is a bounded cost against
      // three standing false findings in a check whose whole value is that
      // its findings are worth acting on.
      if (/\s/.test(value)) continue;

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
      else if (e.name.endsWith(".ts")) scan(p);
    }
  };

  for (const d of SOURCE_DIRS) walk(join(root, d));
  return { prefixes, artefacts, marked, refused };
}

/** A test file's literals are governed by the witness list, not by the count. */
export function isTestFile(file: string): boolean {
  return file.endsWith(".test.ts");
}

/**
 * The literals that RESOLVE today, as a committed positive list.
 *
 * ## Why a witness list and not a count
 *
 * The per-file count is a ratchet over what is WRONG. It cannot express the
 * thing this check is ultimately for — *this literal names a real artefact,
 * and must go on naming one*. Two defects followed from that, both found
 * 2026-09-20 (bean `dhol`):
 *
 *  - `declared-paths.test.ts` asserted "every artefact dereferences" over a
 *    list whose membership test IS `existsSync`. **Structurally vacuous** —
 *    it could never fail. Relocate an artefact and the literal silently
 *    leaves `artefacts` for `refused`; the assertion goes on passing over a
 *    shorter list.
 *  - Counting test files would have fired on every NEW test that builds a
 *    fixture tree, because a fixture literal correctly names nothing. A gate
 *    that routinely fires for a non-defect is the one this module's header
 *    twice says somebody switches off. Measured immediately: a sibling's
 *    `schemas/folio-dir.test.ts`, merged from main the same hour, tripped it
 *    with two literals that were both entirely correct.
 *
 * A witness inverts both. It fires when a recorded literal STOPS resolving —
 * which is relocation, the actual defect — and stays silent for a new fixture
 * literal, which was never a witness. So test files leave the count ratchet
 * entirely: for a test, naming nothing is the normal case and counting it is
 * noise.
 */
export function witnessesOf(scan: Scan): string[] {
  return [...new Set(scan.artefacts.map((a) => `${a.file}::${a.literal}`))].sort();
}

if (import.meta.main) {
  const { prefixes, artefacts, marked, refused } = scanDeclaredPaths(root);

  interface Baseline { _comment: string; files: Record<string, number>; resolves: string[] }

  const prior: Baseline = existsSync(BASELINE)
    ? (JSON.parse(readFileSync(BASELINE, "utf-8")) as Baseline)
    : { _comment: "", files: {}, resolves: [] };

  // Test files are governed by the witness list below, not by this count:
  // for a test, a literal naming nothing is a fixture or a test vector, which
  // is the normal case. See `witnessesOf`.
  const current: Record<string, number> = {};
  for (const r of refused) if (!isTestFile(r.file)) current[r.file] = (current[r.file] ?? 0) + 1;

  const witnesses = witnessesOf({ prefixes, artefacts, marked, refused });
  const held = new Set(witnesses);
  const lost = (prior.resolves ?? []).filter((w) => !held.has(w));

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

  console.log(
    `  ${lost.length ? "✗" : "✓"} ${String(artefacts.length).padStart(3)}  ` +
      `name a file that exists — ${witnesses.length} witnessed, ${lost.length} lost`,
  );
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

  if (lost.length) {
    console.log(
      "\nA WITNESSED LITERAL STOPPED RESOLVING — the artefact moved, or was deleted,\n" +
        "and the code naming it was not updated. This is the defect the witness list\n" +
        "exists for; `log-writer.test.ts` went ENOENT this way and then reported a\n" +
        "false finding about the corpus (bean `dhol`).",
    );
    for (const w of lost) {
      const [file, literal] = w.split("::");
      console.log(`  ✗ ${file}  →  "${literal}"`);
    }
    console.log(
      "\nPoint it at where the artefact went. If it was deliberately deleted, re-run\n" +
        "with --update: dropping a witness is a diff somebody reviews.",
    );
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
      // The text the committed baseline already carried. It described only
      // `files` here while the JSON described BOTH records, because the better
      // sentence was written INTO the artefact and never into the writer —
      // so every `--update` silently reverted it, and the next reader learnt
      // nothing about `resolves` from the file `resolves` lives in. Found
      // 2026-09-20 by running `--update` for an unrelated relocation.
      //
      // A generated file's own header is generated; editing it in place is the
      // same defect as hand-editing any other generated output, and it is
      // invisible until somebody regenerates.
      _comment:
        "TWO records, with different jobs. `files`: per-file counts of " +
        "declared-path literals that neither resolve nor carry a " +
        "`declared-path-literal: <reason>` marker — recorded debt for SOURCE " +
        "files, which may only go DOWN. `resolves`: the WITNESS list — every " +
        "literal that resolves to a real artefact today, as `<file>::<literal>`. " +
        "A witness that stops resolving means the artefact moved and the code " +
        "naming it did not follow; that fails the gate. *.test.ts files appear " +
        "ONLY in `resolves`, never in `files`: a test that builds a mkdtemp " +
        "fixture names declared directories by necessity, so counting its " +
        "unresolved literals would fire on every new test (measured 2026-09-20 " +
        "— a sibling's schemas/folio-dir.test.ts tripped it with two correct " +
        "literals). Both are WRITTEN by `bun run check:declared-paths --update`; " +
        "raising a count or dropping a witness is a diff somebody reviews. See " +
        "the module header of scripts/check-declared-paths.ts.",
      files: Object.fromEntries(Object.entries(current).sort(([a], [b]) => a.localeCompare(b))),
      resolves: witnesses,
    };
    writeFileSync(BASELINE, `${JSON.stringify(next, null, 2)}\n`);
    const counted = Object.values(current).reduce((a, b) => a + b, 0);
    console.log(
      `\nBaseline written: ${relative(root, BASELINE)} — ${counted} counted across ` +
        `${Object.keys(current).length} source file(s), ${witnesses.length} witnessed literal(s). ` +
        `${refused.length - counted} literal(s) in tests are governed by the witnesses, not counted.`,
    );
    if (over.length) console.log("RAISED for the files above — that belongs in the diff somebody reviews.");
    process.exit(0);
  }

  if (lost.length) {
    console.log(`\n${lost.length} witnessed literal(s) no longer resolve.`);
    process.exit(1);
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
