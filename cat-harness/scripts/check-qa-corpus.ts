#!/usr/bin/env bun
/**
 * check-qa-corpus — validate a QA results tree as a whole: every declared `qa`
 * directory and every HOSTED kg-qa home in it. Bean `cxcn`, reader audit
 * family F7 (`docs/proposals/qa-readers-audit-2026-10-01.md` §5.5, R65/R66).
 *
 * ## Why a gate, and not a test
 *
 * These assertions lived in `schemas/kg-qa.test.ts` ("every committed kg-qa
 * validates", "no critical criterion is failing on main", the hosted
 * bootstrap manifest exists). A test that reads the COMMITTED corpus has two
 * failure modes once that corpus leaves `main` for the `qa-reports` branch
 * (owner rulings D1/D4, bean `5hox`): it fails for a reason that is not a
 * defect (the files are not in the checkout), or it iterates over zero files
 * and goes vacuously green. The audit measured both: 15 tests failing only
 * when the corpus was absent, and "no critical criterion" passing over
 * nothing. So the tests now assert on fixtures and fresh runs, and the corpus
 * itself is judged here, over the tree `qa:fetch` materialises.
 *
 * ## What it walks
 *
 * The tree is laid out like the checkout (`<instance>/test/results/**`), the
 * layout every `qa-reports` entry keeps. Inside it, this walks:
 *
 * - every directory any instance DECLARES as a `qa` graph, mapped into the tree;
 * - every instance's kg-qa home as `kgQaHomeFor` resolves it — `own`,
 *   `hosted` (`cat-harness/test/results/bootstrap/`, `bootstrap-tools/`,
 *   `cat-harness-tools/`) or `convention`. The old test walked only
 *   cat-harness's own `kg-qa/`, which is why three conflict-marked sidecars in
 *   the hosted homes went unseen (bean `de9k`, C1).
 *
 * ## What it judges
 *
 * 1. Every file is readable: no git conflict marker of any width, and every
 *    `.json` parses (`checkQaFile`, shared with `qa-graph-integrity`).
 * 2. Every `*.kg-qa.json` validates against `KgQaReportSchema`, names only
 *    registered criteria that apply to its subject kind, records no `fail`
 *    without findings, and has no CRITICAL criterion other than pass or n/a.
 * 3. Every home holding kg-qa sidecars holds a `kg-qa.manifest.json` that
 *    validates against `KgQaManifestSchema`.
 *
 * ## Four states, and a miss is never clean
 *
 * | exit | state | meaning |
 * |---|---|---|
 * | 0 | ok | examined at least one file, no finding |
 * | 1 | finding | a determined defect: a marker, bad JSON, a schema break, a critical criterion, a corrupt store entry |
 * | 2 | unknown | could not determine: the fetch missed or failed, or the tree held nothing to examine. **Never a pass.** |
 * | 2 | error | malformed invocation |
 *
 * `--github` (CI, the `qa-publish` job) derives the same key `qa:publish
 * --github` writes. When publishing is skipped (a fork PR, a non-main push) it
 * says so with a `::notice` and exits 0 — the same stated skip the publish
 * makes, because there is no entry for this run to judge.
 *
 * Usage:
 *   bun run check:qa-corpus --dir <tree>      # a tree already fetched (qa:fetch --into <tree>)
 *   bun run check:qa-corpus --ref <ref>       # fetch main | <sha> | pr/<n>[/<sha>] into a temp dir, then judge
 *   bun run check:qa-corpus --github          # CI: the entry this run published
 *
 * @module scripts/check-qa-corpus
 * @covers qa
 */
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, type Dirent } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";

import { checkQaDirs } from "../content/pipeline/qa-graph-integrity.ts";
import { directoriesForGraph, instanceRootsIn, kgQaHomeFor, repoRootFor } from "../schemas/cat-harness.js";
// `directoriesForGraph` reads declarations, which throw on the `folio` kind
// unless core has registered it — the same side-effect import qa-store carries.
import "../schemas/folio-graph-kind.js";
import {
  criteriaFor,
  KG_CRITERIA_BY_ID,
  KgQaManifestSchema,
  KgQaReportSchema,
  type KgQaReport,
} from "../schemas/kg-qa.ts";
import { JUDGEMENT_EXIT } from "./qa-results.ts";
import { githubPublishDecision, QaUsageError, readQaTree } from "./qa-store.ts";

const HARNESS = resolve(import.meta.dir, "..");
const REPO = repoRootFor(HARNESS);

export type CorpusProblem =
  | "conflict-marker"
  | "unparseable-json"
  | "schema"
  | "unknown-criterion"
  | "fail-without-findings"
  | "critical-failing"
  | "manifest-missing"
  | "manifest-schema";

export interface CorpusFinding {
  /** Tree-relative path. */
  path: string;
  problem: CorpusProblem;
  detail: string;
}

export interface CorpusHome {
  /** Tree-relative kg-qa home, e.g. `cat-harness/test/results/bootstrap`. */
  home: string;
  by: "own" | "hosted" | "convention";
  /** `*.kg-qa.json` files found under `<home>/kg-qa/`. */
  sidecars: number;
}

export interface CorpusReport {
  /** Tree-relative directories walked. */
  dirs: string[];
  homes: CorpusHome[];
  /** Files examined. `0` is not clean: it is `unknown`. */
  examined: number;
  findings: CorpusFinding[];
}

/** Every `*.kg-qa.json` under `dir`, recursively. */
function kgQaFilesUnder(dir: string): string[] {
  const out: string[] = [];
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...kgQaFilesUnder(p));
    else if (e.name.endsWith(".kg-qa.json")) out.push(p);
  }
  return out;
}

/**
 * The repository-relative directories to walk: every declared `qa` directory
 * and every instance's kg-qa home. Derived from THIS checkout's declarations,
 * because a fetched tree carries results, not declarations.
 */
export function corpusLayout(repoRoot: string = REPO, harness: string = join(repoRoot, "cat-harness")): {
  dirs: string[];
  homes: Array<{ home: string; by: CorpusHome["by"] }>;
} {
  const dirs = new Set<string>();
  const homes = new Map<string, CorpusHome["by"]>();
  for (const inst of instanceRootsIn(repoRoot)) {
    for (const d of directoriesForGraph(inst, "qa")) dirs.add(rel(repoRoot, d));
    const h = kgQaHomeFor(inst, harness);
    const home = rel(repoRoot, h.root);
    if (!homes.has(home)) homes.set(home, h.by);
    dirs.add(home);
  }
  return {
    dirs: [...dirs].sort(),
    homes: [...homes].map(([home, by]) => ({ home, by })).sort((a, b) => a.home.localeCompare(b.home)),
  };
}

function rel(root: string, abs: string): string {
  return relative(root, resolve(abs)).split("\\").join("/");
}

/** Judge one kg-qa sidecar's content. */
export function judgeKgQa(path: string, doc: unknown): CorpusFinding[] {
  const parsed = KgQaReportSchema.safeParse(doc);
  if (!parsed.success) return [{ path, problem: "schema", detail: parsed.error.message }];
  const r = doc as KgQaReport;
  const out: CorpusFinding[] = [];
  const allowed = new Set(criteriaFor(r.subject.kind).map((c) => c.id));
  for (const [id, e] of Object.entries(r.criteria)) {
    if (!KG_CRITERIA_BY_ID[id] || !allowed.has(id)) {
      out.push({ path, problem: "unknown-criterion", detail: `${id} is not a registered criterion for ${r.subject.kind}` });
      continue;
    }
    if (e.result === "fail" && e.findings.length === 0) {
      out.push({ path, problem: "fail-without-findings", detail: `${id} is fail with no findings — a failure a reader cannot act on` });
    }
    if (e.result !== "pass" && e.result !== "n/a" && KG_CRITERIA_BY_ID[id]!.severity === "critical") {
      out.push({ path, problem: "critical-failing", detail: `${r.subject.kind}:${r.subject.id} ${id}=${e.result}` });
    }
  }
  return out;
}

/**
 * Validate a tree laid out like the checkout. `tree` is the checkout itself or
 * a directory `qa:fetch --into` wrote.
 */
export function validateQaTree(
  tree: string,
  layout: ReturnType<typeof corpusLayout> = corpusLayout(),
): CorpusReport {
  const root = resolve(tree);
  const integrity = checkQaDirs(layout.dirs.map((d) => join(root, d)));
  const findings: CorpusFinding[] = integrity.findings.map((f) => ({
    path: rel(root, f.path),
    problem: f.problem,
    detail: f.detail,
  }));
  const unreadable = new Set(findings.map((f) => f.path));

  const homes: CorpusHome[] = [];
  const seen = new Set<string>();
  for (const { home, by } of layout.homes) {
    const files = kgQaFilesUnder(join(root, home, "kg-qa"));
    homes.push({ home, by, sidecars: files.length });
    for (const f of files) {
      const p = rel(root, f);
      if (seen.has(p) || unreadable.has(p)) continue;
      seen.add(p);
      findings.push(...judgeKgQa(p, JSON.parse(readFileSync(f, "utf-8"))));
    }
    if (files.length === 0) continue;
    const mPath = join(home, "kg-qa.manifest.json");
    let text: string;
    try {
      text = readFileSync(join(root, mPath), "utf-8");
    } catch {
      findings.push({ path: mPath, problem: "manifest-missing", detail: `${files.length} sidecar(s) under ${home}/kg-qa/ and no auditor manifest beside them` });
      continue;
    }
    if (unreadable.has(mPath)) continue;
    const m = KgQaManifestSchema.safeParse(JSON.parse(text));
    if (!m.success) findings.push({ path: mPath, problem: "manifest-schema", detail: m.error.message });
  }
  findings.sort((a, b) => a.path.localeCompare(b.path) || a.problem.localeCompare(b.problem));
  return { dirs: layout.dirs, homes, examined: integrity.examined, findings };
}

/** The judgement a report earns. `examined: 0` is unknown, never ok. */
export function judgeReport(r: CorpusReport): "ok" | "finding" | "unknown" {
  if (r.findings.length) return "finding";
  return r.examined === 0 ? "unknown" : "ok";
}

/** Materialise a store entry into a fresh temp dir. Never writes into the checkout. */
function fetchInto(ref: string): { state: "hit"; dir: string; key: string } | { state: "miss" | "unknown" | "corrupt"; reason: string; bad?: string[] } {
  const t = readQaTree(ref, "");
  if (t.state !== "hit") return t;
  const dir = mkdtempSync(join(tmpdir(), "qa-corpus-"));
  for (const [p, text] of t.files) {
    const dest = join(dir, p);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, text);
  }
  return { state: "hit", dir, key: t.key };
}

function print(r: CorpusReport, from: string): void {
  console.log(`check:qa-corpus — ${from}`);
  console.log(`  ${r.dirs.length} director(ies) walked, ${r.examined} file(s) examined`);
  for (const h of r.homes) console.log(`  ${h.by.padEnd(10)} ${h.home}/kg-qa  ${h.sidecars} sidecar(s)`);
  for (const f of r.findings) console.log(`  ✗ ${f.path} — ${f.problem}: ${f.detail}`);
}

export function main(argv: string[]): number {
  const one = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    if (i < 0) return undefined;
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) throw new QaUsageError(`${flag} needs a value`);
    return v;
  };
  const dir = one("--dir");
  let ref = one("--ref");
  const github = argv.includes("--github");
  if ([dir, ref, github ? "x" : undefined].filter(Boolean).length !== 1) {
    throw new QaUsageError("give exactly one of --dir <tree>, --ref <ref>, --github");
  }

  if (dir !== undefined) {
    const r = validateQaTree(dir);
    print(r, `tree ${dir}`);
    return finish(r);
  }

  if (github) {
    let event: unknown;
    try {
      event = process.env.GITHUB_EVENT_PATH ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf-8")) : undefined;
    } catch {
      event = undefined;
    }
    const d = githubPublishDecision(process.env, event);
    if (!d.publish) {
      // The publish made the same decision and said so; there is no entry
      // for this run to judge. Stated, never silent.
      console.log(`::notice title=check:qa-corpus skipped::no qa-reports entry for this run — ${d.reason}`);
      return 0;
    }
    ref = d.ref;
  }

  const f = fetchInto(ref!);
  if (f.state === "corrupt") {
    // A determined defect in the stored record: present and unusable.
    console.log(`check:qa-corpus — qa-reports ${ref}: CORRUPT — ${f.reason}`);
    for (const b of f.bad ?? []) console.log(`  ✗ ${b} — unparseable-json`);
    return JUDGEMENT_EXIT.finding;
  }
  if (f.state !== "hit") {
    console.log(`? check:qa-corpus — qa-reports ${ref}: ${f.state.toUpperCase()} — ${f.reason}`);
    console.log("  Could not determine. A miss is not a clean corpus. Exit 2.");
    return JUDGEMENT_EXIT.unknown;
  }
  try {
    const r = validateQaTree(f.dir);
    print(r, `qa-reports ${f.key}`);
    return finish(r);
  } finally {
    rmSync(f.dir, { recursive: true, force: true });
  }
}

function finish(r: CorpusReport): number {
  const j = judgeReport(r);
  if (j === "unknown") console.log("? nothing examined — an empty tree is not a clean corpus. Exit 2.");
  else if (j === "ok") console.log(`✓ ${r.examined} file(s) readable; every kg-qa sidecar and manifest validates`);
  else console.log(`✗ ${r.findings.length} finding(s)`);
  return JUDGEMENT_EXIT[j];
}

if (import.meta.main) {
  let code: number;
  try {
    code = main(process.argv.slice(2));
  } catch (e) {
    if (e instanceof QaUsageError) {
      console.error(`check:qa-corpus: ${e.message}`);
      code = JUDGEMENT_EXIT.error;
    } else {
      console.error(`check:qa-corpus: could not determine — ${(e as Error).message}. This is NOT a pass.`);
      code = JUDGEMENT_EXIT.unknown;
    }
  }
  process.exit(code);
}
