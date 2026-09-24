/**
 * Every declared harness visualiser has a wireframe, and every wireframe has
 * passed its mechanical checks at BOTH a web and a mobile viewport.
 *
 * Owner, 2026-09-23 (issue #1023): *"make sure wireframes for existing harness
 * visualizers etc. are complete in docs/ (QA sidecar need). put wireframe in
 * cat-harness"*, and *"need both web and mobile layouts in usability reviews"*.
 *
 * ## What it reads
 *
 * - **The declarations.** Every instance's `coverage.visualiser`, through
 *   {@link visualisationsOf}, so there is no second list of visualisers
 *   free to disagree with the navbar's.
 * - **`cat-harness/docs/wireframes/index.json`.** Which wireframe covers
 *   which declared ref. One wireframe may cover several refs, because one
 *   template renders several libraries.
 * - **Each wireframe directory.** It must hold `intent.md`, at least one
 *   candidate `.html`, and `checks/report.json` written by `wireframe:check`
 *   (the Tool `wireframe-check`).
 *
 * ## What fails
 *
 * - a declared visualiser that no wireframe covers
 * - a wireframe with no intent, or no candidate
 * - a candidate with no check report
 * - a candidate whose report lacks a viewport, or holds a `fail`
 *
 * A review done at one width is incomplete, not passed. That is the rule the
 * missing-viewport family enforces.
 *
 * Usage:
 *   bun run check:wireframes            # report, write the sidecar, exit 1 on any gap
 *   bun run check:wireframes -- --json  # print the sidecar document
 *
 * @module scripts/check-wireframes
 * @covers cat-harness, docs — the declarations supply the visualiser list through
 *   `visualisationsOf`, and the wireframes it requires of them live in the docs tree
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { instanceRootsIn, readDeclaration, repoRootFor, siteDirFor, visualisationsOf } from "../schemas/cat-harness.ts";
import { buildQaResult, writeQaResult } from "./qa-results.ts";

const INSTANCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = repoRootFor(INSTANCE_ROOT);
/** Wireframes live in the site, under `<site>/wireframes/`, so they publish with it. */
const WIREFRAMES = join(INSTANCE_ROOT, siteDirFor(INSTANCE_ROOT), "wireframes");
/** The two viewports every usability review needs (owner, 2026-09-23). */
export const VIEWPORTS = ["web", "mobile"] as const;

type Index = { wireframes: Record<string, { covers: string[] }> };
type ReportEntry = { viewport: string; criterion: string; result: string; notes?: string };
type Report = { candidates: { file: string; entries: ReportEntry[] }[] };

export interface WireframeReport {
  declared: string[];
  covered: { ref: string; wireframe: string }[];
  uncovered: { ref: string }[];
  unknownRef: { wireframe: string; ref: string }[];
  incomplete: { wireframe: string; problem: string }[];
  missingViewport: { wireframe: string; candidate: string; viewport: string }[];
  failing: { wireframe: string; candidate: string; viewport: string; criterion: string; notes?: string }[];
}

/** Every declared visualiser ref, across every instance under the repository root. */
export function declaredVisualisers(repoRoot: string = REPO_ROOT): string[] {
  const refs = new Set<string>();
  for (const root of instanceRootsIn(repoRoot)) {
    const decl = readDeclaration(root);
    for (const d of decl?.directories ?? []) {
      for (const v of visualisationsOf(d.coverage, d.id)) refs.add(v.ref);
    }
  }
  return [...refs].sort();
}

export function checkWireframes(repoRoot: string = REPO_ROOT, dir: string = WIREFRAMES): WireframeReport {
  const r: WireframeReport = {
    declared: declaredVisualisers(repoRoot),
    covered: [],
    uncovered: [],
    unknownRef: [],
    incomplete: [],
    missingViewport: [],
    failing: [],
  };
  const indexFile = join(dir, "index.json");
  const index: Index = existsSync(indexFile) ? JSON.parse(readFileSync(indexFile, "utf-8")) : { wireframes: {} };
  const coverer = new Map<string, string>();
  for (const [name, w] of Object.entries(index.wireframes)) {
    for (const ref of w.covers) {
      if (!r.declared.includes(ref)) r.unknownRef.push({ wireframe: name, ref });
      coverer.set(ref, name);
    }
    const wdir = join(dir, name);
    if (!existsSync(join(wdir, "intent.md"))) r.incomplete.push({ wireframe: name, problem: "no intent.md" });
    const candidates = existsSync(wdir) ? readdirSync(wdir).filter((f) => f.endsWith(".html")).sort() : [];
    if (candidates.length === 0) {
      r.incomplete.push({ wireframe: name, problem: "no candidate .html" });
      continue;
    }
    const reportFile = join(wdir, "checks", "report.json");
    if (!existsSync(reportFile)) {
      r.incomplete.push({ wireframe: name, problem: "no checks/report.json: run `bun run wireframe:check`" });
      continue;
    }
    const report: Report = JSON.parse(readFileSync(reportFile, "utf-8"));
    for (const c of candidates) {
      const entries = report.candidates.find((x) => basename(x.file) === c)?.entries;
      if (entries === undefined) {
        r.incomplete.push({ wireframe: name, problem: `${c} is not in checks/report.json` });
        continue;
      }
      for (const vp of VIEWPORTS) {
        const at = entries.filter((e) => e.viewport === vp);
        if (at.length === 0) r.missingViewport.push({ wireframe: name, candidate: c, viewport: vp });
        for (const e of at.filter((x) => x.result !== "pass"))
          r.failing.push({ wireframe: name, candidate: c, viewport: vp, criterion: e.criterion, ...(e.notes ? { notes: e.notes } : {}) });
      }
    }
  }
  for (const ref of r.declared) {
    const w = coverer.get(ref);
    if (w) r.covered.push({ ref, wireframe: w });
    else r.uncovered.push({ ref });
  }
  return r;
}

export function wireframeGaps(r: WireframeReport): number {
  return r.uncovered.length + r.unknownRef.length + r.incomplete.length + r.missingViewport.length + r.failing.length;
}

if (import.meta.main) {
  const r = checkWireframes();
  if (r.declared.length === 0) {
    console.error("UNDETERMINED: no declared visualiser found. This is not a pass; nothing was checked.");
    process.exit(2);
  }
  const doc = buildQaResult({
    script: "cat-harness/scripts/check-wireframes.ts",
    scriptAbsPath: fileURLToPath(import.meta.url),
    subject: { kind: "corpus", id: "harness-visualiser-wireframes" },
    families: {
      covered: { summary: "A declared visualiser with a wireframe whose checks pass at both viewports.", entries: r.covered },
      uncovered: { summary: "A declared visualiser that no wireframe covers.", entries: r.uncovered },
      "unknown-ref": { summary: "index.json names a ref that no declaration declares: a stale or mistyped mapping.", entries: r.unknownRef },
      incomplete: { summary: "A wireframe missing its intent, its candidate or its check report.", entries: r.incomplete },
      "missing-viewport": {
        summary: "A candidate checked at only one width. A usability review at one viewport is incomplete, not passed.",
        entries: r.missingViewport,
      },
      failing: { summary: "A mechanical check that failed: renders, no-overflow or no-placeholder.", entries: r.failing },
    },
  });
  if (process.argv.includes("--json")) console.log(JSON.stringify(doc, null, 2));
  else {
    writeQaResult(INSTANCE_ROOT, "wireframes", doc);
    console.log(`wireframes: ${r.covered.length}/${r.declared.length} declared visualiser(s) covered`);
    for (const u of r.uncovered) console.log(`  ✗ no wireframe: ${u.ref}`);
    for (const u of r.unknownRef) console.log(`  ✗ ${u.wireframe}: covers an undeclared ref ${u.ref}`);
    for (const i of r.incomplete) console.log(`  ✗ ${i.wireframe}: ${i.problem}`);
    for (const m of r.missingViewport) console.log(`  ✗ ${m.wireframe}/${m.candidate}: no ${m.viewport} check`);
    for (const f of r.failing) console.log(`  ✗ ${f.wireframe}/${f.candidate}: ${f.viewport} ${f.criterion} failed`);
  }
  if (wireframeGaps(r) > 0) process.exit(1);
}
