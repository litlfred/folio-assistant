#!/usr/bin/env bun
/**
 * No instance spells a path into ANOTHER instance's declared directories.
 *
 * @module cat-harness/scripts/check-foreign-paths
 * @covers code — every instance's own source, read for literals that name a directory some other instance declares
 *
 * Bean `gz47`. `check:declared-paths` reads one instance's code against that
 * instance's OWN declarations, so it cannot see the case that broke the
 * fsh-guts tests: platform code naming the root instance's `fsh-guts/`,
 * `beans/`, `uploads/`, … by literal. Those are exactly the directories moving
 * to their own branches (beans `9c7h`, `2h76`), and a spelled path keeps
 * "finding" an empty directory after the move. Batches 1–4 of gz47 fixed the
 * real reads by hand; this is the ratchet that stops new ones.
 *
 * ## What counts
 *
 * The scanning machinery is `check-declared-paths.ts`'s own, imported rather
 * than copied: comments stripped, a bare segment counted only as the FIRST
 * literal of a path-building call, templates and sentences skipped, and the
 * `declared-path-literal: <reason>` marker honoured.
 *
 * What is new is WHICH names count. A literal is foreign when it lands in a
 * directory another instance declares — and the scanning instance does NOT
 * declare a directory of the same name itself. `docs/` is the case that rule
 * exists for: the root declares one and so does cat-harness, so
 * `join(ROOT, "docs")` in cat-harness is almost always its own, and counting
 * it would make the check cry wolf (gz47's first measurement counted 145 such
 * hits). Names only another instance declares — `beans`, `todos`, `fsh-guts`,
 * `uploads`, `issue-marks` — carry no such ambiguity.
 *
 * Three more exclusions, each measured on this corpus (gz47): a module
 * specifier (`"../cat-harness/schemas/x.js"`) is code addressed by path; a
 * literal nested in another call inside the path call (`resolve(opt("todos"))`)
 * is an option name; and a segment joined onto the INSTANCE's own root
 * (`join(INSTANCE, "docs")`) is that instance's directory.
 *
 * Test files are out of the count, as in `check:declared-paths`: a test that
 * builds a fixture names declared directories by necessity (gz47 batch 1: 50
 * such lines in one test file).
 *
 * ## A ratchet, one way
 *
 * The committed baseline (`foreign-path-baseline.json`) records a count per
 * file. A file above its count is red; a file below it is reported with the
 * command that lowers the list, not red — the same one-way rule as
 * `check:standalone`, so a fix elsewhere never turns an unrelated PR red.
 *
 * Usage: bun run check:foreign-paths [--update]
 * Exit:  0 at or under the baseline · 1 above it
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, normalize, relative, resolve, sep } from "node:path";

import { instanceRootsIn, readDeclaration, resolveDirectories, repoRootFor } from "../schemas/cat-harness.js";
import {
  LITERAL,
  firstLiteralIn,
  isAddressedByPath,
  isTestFile,
  markerCoverage,
  pathContextRanges,
  stripComments,
} from "./check-declared-paths.js";

export const BASELINE_PATH = resolve(import.meta.dir, "foreign-path-baseline.json");

/** One instance and the directories it declares, repo-relative and code-free. */
export interface InstanceDirs {
  name: string;
  /** Repo-relative instance root ("" for the checkout root). */
  root: string;
  /** Repo-relative declared directories, without a trailing slash. */
  dirs: string[];
}

export interface ForeignSite {
  file: string;
  line: number;
  literal: string;
  /** The foreign directory it lands in, and who declares it. */
  target: string;
  owner: string;
}

export interface ForeignScan {
  counted: ForeignSite[];
  marked: Array<ForeignSite & { reason: string }>;
}

/** Every instance's declared, non-code directories, repo-relative. */
export function instanceDirsIn(repo: string): InstanceDirs[] {
  return instanceRootsIn(repo).map((at) => {
    const abs = resolve(at);
    const name = readDeclaration(abs)?.name ?? (relative(repo, abs) || ".");
    const dirs = resolveDirectories([{ name, root: abs, own: true }])
      .filter((d) => d.own && !isAddressedByPath(d))
      .map((d) => relative(repo, resolve(d.absPath)).replace(/\\/g, "/").replace(/\/+$/, ""))
      .filter((p) => p.length > 0 && !p.startsWith(".."));
    return { name, root: relative(repo, abs).replace(/\\/g, "/"), dirs: [...new Set(dirs)] };
  });
}

/** The last path segment of each directory an instance declares: the names it OWNS. */
function ownNames(i: InstanceDirs): Set<string> {
  return new Set(i.dirs.map((d) => d.split("/").pop()!));
}

/**
 * The directories `scanner`'s code must not spell: every other instance's,
 * minus any whose name the scanner declares for itself (the `docs/` rule).
 */
export function foreignTargets(scanner: InstanceDirs, all: InstanceDirs[]): Array<{ dir: string; owner: string }> {
  const mine = ownNames(scanner);
  const own = new Set(scanner.dirs);
  const out: Array<{ dir: string; owner: string }> = [];
  for (const other of all) {
    if (other.name === scanner.name) continue;
    for (const dir of other.dirs) {
      if (own.has(dir) || mine.has(dir.split("/").pop()!)) continue;
      // A directory INSIDE the scanner's own tree is the scanner's to name.
      if (scanner.root !== "" && (dir === scanner.root || dir.startsWith(`${scanner.root}/`))) continue;
      out.push({ dir, owner: other.name });
    }
  }
  return out.sort((a, b) => b.dir.length - a.dir.length);
}

/** Tracked, non-test `.ts` files of an instance, excluding nested instances. */
function sourceFiles(repo: string, inst: InstanceDirs, all: InstanceDirs[]): string[] {
  const nested = all.map((i) => i.root).filter((r) => r !== inst.root && (inst.root === "" || r.startsWith(`${inst.root}/`)));
  const listed = execFileSync("git", ["-C", repo, "ls-files", "-z", "--", inst.root === "" ? "*.ts" : `${inst.root}/*.ts`], {
    encoding: "utf-8",
    maxBuffer: 256 * 1024 * 1024,
  })
    .split("\0")
    .filter(Boolean);
  return listed.filter(
    (f) =>
      !nested.some((r) => r !== "" && f.startsWith(`${r}/`)) &&
      !isTestFile(f) &&
      !f.endsWith(".e2e.ts") &&
      !f.includes("/tests/") &&
      !f.includes("/fixtures/") &&
      !f.includes("node_modules/"),
  );
}

/** Scan one file's text for literals landing in a foreign directory. */
export function scanText(
  text: string,
  file: string,
  instRoot: string,
  targets: Array<{ dir: string; owner: string }>,
): ForeignScan {
  const counted: ForeignSite[] = [];
  const marked: ForeignScan["marked"] = [];
  const rawLines = text.split("\n");
  const code = stripComments(text);
  const lines = code.split("\n");
  const cover = markerCoverage(rawLines);
  const ranges = pathContextRanges(code);
  const lineStart: number[] = [];
  {
    let acc = 0;
    for (const l of lines) {
      lineStart.push(acc);
      acc += l.length + 1;
    }
  }
  for (let n = 0; n < lines.length; n++) {
    const line = lines[n]!;
    const re = new RegExp(LITERAL.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      const value = m[2]!;
      if (/[$<]/.test(value) || /\s/.test(value) || value === "") continue;
      // A module specifier is CODE, addressed by path on purpose — the same
      // exemption `check:declared-paths` gives code directories.
      if (/\.(?:[cm]?[jt]sx?)$/.test(value)) continue;
      // As written (repo-relative), or `../`-relative to the instance's root.
      const asRepo = value.startsWith("../") && instRoot !== "" ? normalize(join(instRoot, value)).split(sep).join("/") : value;
      const hit = targets.find((t) => asRepo === t.dir || asRepo.startsWith(`${t.dir}/`));
      if (!hit) continue;
      // A bare segment is a path only as the first literal of a path-building call.
      if (!value.includes("/")) {
        const at = lineStart[n]! + m.index;
        const range = ranges.find(([a, b]) => at >= a && at < b);
        if (range === undefined || firstLiteralIn(code, range) !== at) continue;
        // ...and only when that call ENCLOSES it directly: in
        // `resolve(opt("todos"))` the literal is an option NAME (gz47, measured).
        if (nestedInAnotherCall(code, range[0], at)) continue;
        // ...and not when the call builds from the INSTANCE's own root:
        // `join(INSTANCE, "docs")` is that instance's directory (gz47, measured
        // on fhir-harness), whatever another instance also declares.
        if (INSTANCE_BASE.test(code.slice(range[0], at))) continue;
      }
      const site: ForeignSite = { file, line: n + 1, literal: value, target: hit.dir, owner: hit.owner };
      const reason = cover.get(n);
      if (reason !== undefined) marked.push({ ...site, reason });
      else counted.push(site);
    }
  }
  return { counted, marked };
}

/** True when, between a call's opening paren and `at`, another call is still open. */
function nestedInAnotherCall(code: string, start: number, at: number): boolean {
  let depth = 0;
  for (let i = at - 1; i >= start; i--) {
    const c = code[i];
    if (c === ")") depth++;
    else if (c === "(") {
      if (depth === 0) return true;
      depth--;
    }
  }
  return false;
}

/**
 * A base argument that names the INSTANCE rather than the checkout. A
 * heuristic over names, stated as one: `ROOT` is not in it, because in this
 * corpus `ROOT` is as often the checkout as the instance, and a missed foreign
 * path is the cheaper error for a ratchet that must not cry wolf.
 */
const INSTANCE_BASE = /^\s*(?:INSTANCE\w*|instanceRoot|instance|HERE|import\.meta\.dir|__dirname)\b/;

export function scanForeignPaths(repo: string): ForeignScan {
  const all = instanceDirsIn(repo);
  const out: ForeignScan = { counted: [], marked: [] };
  for (const inst of all) {
    const targets = foreignTargets(inst, all);
    if (targets.length === 0) continue;
    for (const f of sourceFiles(repo, inst, all)) {
      const abs = join(repo, f);
      if (!existsSync(abs)) continue;
      const r = scanText(readFileSync(abs, "utf-8"), f, inst.root, targets);
      out.counted.push(...r.counted);
      out.marked.push(...r.marked);
    }
  }
  return out;
}

export function countsOf(scan: ForeignScan): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of scan.counted) out[s.file] = (out[s.file] ?? 0) + 1;
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

export interface Judgement {
  exit: 0 | 1;
  over: Array<{ file: string; was: number; now: number }>;
  under: Array<{ file: string; was: number; now: number }>;
}

/** Pure: current counts against the baseline. One way: only a rise is red. */
export function judge(current: Record<string, number>, baseline: Record<string, number>): Judgement {
  const over: Judgement["over"] = [];
  const under: Judgement["under"] = [];
  for (const [file, now] of Object.entries(current)) {
    const was = baseline[file] ?? 0;
    if (now > was) over.push({ file, was, now });
  }
  for (const [file, was] of Object.entries(baseline)) {
    const now = current[file] ?? 0;
    if (now < was) under.push({ file, was, now });
  }
  return { exit: over.length > 0 ? 1 : 0, over, under };
}

const COMMENT =
  "Per-file counts of literals that spell a path into ANOTHER instance's declared directories (bean `gz47`), in non-test source. A RATCHET, one way: a file above its count is red; a file below it is reported with `bun run foreign-paths:baseline`, which lowers the list. WRITTEN by that command; a higher count is a diff somebody reviews. See the module header of cat-harness/scripts/check-foreign-paths.ts.";

if (import.meta.main) {
  const repo = repoRootFor(resolve(import.meta.dir, ".."));
  const scan = scanForeignPaths(repo);
  const current = countsOf(scan);
  if (process.argv.includes("--update")) {
    writeFileSync(BASELINE_PATH, JSON.stringify({ _comment: COMMENT, files: current }, null, 2) + "\n");
    const total = Object.values(current).reduce((a, b) => a + b, 0);
    console.log(`wrote ${relative(repo, BASELINE_PATH)}: ${total} literal(s) in ${Object.keys(current).length} file(s).`);
    process.exit(0);
  }
  const baseline = existsSync(BASELINE_PATH)
    ? ((JSON.parse(readFileSync(BASELINE_PATH, "utf-8")) as { files?: Record<string, number> }).files ?? {})
    : {};
  const j = judge(current, baseline);
  const total = Object.values(current).reduce((a, b) => a + b, 0);
  console.log(
    `Foreign paths — ${total} literal(s) in ${Object.keys(current).length} file(s) spell another instance's declared directory; ${scan.marked.length} marked.`,
  );
  for (const o of j.over) {
    console.log(`  ✗ ${o.file}: ${o.was} → ${o.now}`);
    for (const s of scan.counted.filter((x) => x.file === o.file))
      console.log(`      ${s.file}:${s.line}  "${s.literal}"  → ${s.owner}'s ${s.target}/`);
  }
  if (j.under.length > 0) {
    console.log(`  ${j.under.length} file(s) are below the baseline — \`bun run foreign-paths:baseline\` lowers the list (not a failure).`);
  }
  if (j.exit === 1) {
    console.log(
      "\nResolve the directory through its declaration (directoryForGraph, fshGutsDirectory, beanDefsDir, …), or mark the\n" +
        "site `declared-path-literal: <why this one cannot be read>` — the reason is required.",
    );
  }
  process.exit(j.exit);
}
