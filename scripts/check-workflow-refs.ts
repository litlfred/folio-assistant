#!/usr/bin/env bun
/**
 * Every `<folio:skill ref="…"/>` in a BPMN names a skill that exists, and
 * every activity says which skill implements it.
 *
 * AGENTS.md: "Each activity carries a `<folio:skill ref="…"/>` extension
 * naming the skill that implements it". Nothing checked either half, and both
 * had drifted by the time this was written (2026-09-18):
 *
 *   - `corpus-search` and `paper-relevance-triage` were referenced by
 *     diagrams and resolved to no skill at all, so `workflow_next` would hand
 *     an agent the name of something it cannot open.
 *   - `crdm-requirements.bpmn` carried ONE ref across 35 nodes, and three
 *     diagrams carried none, so the process ran but could only return a step
 *     name.
 *
 * Both are the kind of finding that recurs every time somebody adds a
 * diagram, which is the argument for a check rather than another round of
 * hand-fixing.
 *
 * TWO TIERS, deliberately:
 *   - A DANGLING REF IS AN ERROR. It is unambiguous and it breaks a consumer.
 *   - MISSING COVERAGE IS A REPORT. Some activities genuinely have no skill —
 *     a human signing something off is not implemented by a markdown file —
 *     so failing on coverage would force a fake ref onto a real step, which
 *     is worse than the gap. `--strict` turns it into an error for a caller
 *     that wants the stronger gate.
 *
 * Usage:  bun run check:workflow-refs  [--strict]
 * Exit:   0 clean · 1 dangling ref (or, with --strict, any uncovered activity)
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadProcessModel, isActivity } from "../src/workflow/process-model.js";
import { knownSkills } from "./known-skills.js";

const root = resolve(import.meta.dir, "..");
const strict = process.argv.includes("--strict");

const skills = knownSkills(root);
const dir = join(root, "skills", "workflows");
const files = readdirSync(dir).filter((f) => f.endsWith(".bpmn")).sort();

interface Dangling { file: string; node: string; ref: string }
const dangling: Dangling[] = [];
const coverage: { file: string; covered: number; total: number; uncovered: string[] }[] = [];

for (const file of files) {
  const model = await loadProcessModel(join(dir, file));
  const activities = [...model.nodes.values()].filter(isActivity);
  const uncovered: string[] = [];

  for (const node of activities) {
    const refs = node.skills ?? [];
    if (refs.length === 0) uncovered.push(node.id);
    for (const ref of refs) {
      if (!skills.has(ref)) dangling.push({ file, node: node.id, ref });
    }
  }
  coverage.push({
    file,
    covered: activities.length - uncovered.length,
    total: activities.length,
    uncovered,
  });
}

console.log(`Workflow skill refs  (${skills.size} skills known, ${files.length} diagrams)\n`);

console.log("Coverage — activities naming the skill that implements them");
for (const c of coverage) {
  const pct = c.total === 0 ? 100 : Math.round((c.covered / c.total) * 100);
  const mark = c.covered === c.total ? "✓" : pct === 0 ? "✗" : "·";
  console.log(`  ${mark} ${c.file.padEnd(38)} ${String(c.covered).padStart(2)}/${String(c.total).padEnd(2)}  ${pct}%`);
}

if (dangling.length) {
  console.log("\nDANGLING — the ref names no skill in this repository:");
  for (const d of dangling) {
    console.log(`  ✗ ${d.file} · ${d.node} → "${d.ref}"`);
  }
  console.log(
    `\n${dangling.length} dangling ref(s). workflow_next would hand an agent a\n` +
      `name it cannot open. Either add the skill or point the ref at a real one.`,
  );
}

const totalUncovered = coverage.reduce((n, c) => n + c.uncovered.length, 0);
if (totalUncovered) {
  console.log(`\n${totalUncovered} activit(ies) name no skill. Not an error by itself — a`);
  console.log("human sign-off step has no skill to name — but each one is a step whose");
  console.log("implementation a reader has to guess:");
  for (const c of coverage) {
    if (c.uncovered.length) console.log(`  · ${c.file}: ${c.uncovered.join(", ")}`);
  }
}

if (!dangling.length && !totalUncovered) console.log("\nAll refs resolve, every activity covered.");

/*
 * The same failure, one layer over: `schemas/translation-tools.ts` lists
 * `bpmnDiagrams` per content type — the diagrams whose labels need
 * re-rendering after translation. One entry named
 * `skills/workflows/publication-workflow.bpmn`, which has never existed, so the
 * re-render skipped it silently and a skipped diagram is indistinguishable
 * from a diagram that needed no work.
 */
const { CONTENT_TYPE_TRANSLATIONS } = await import("../schemas/translation-tools.js");
const missingDeclared: string[] = [];
for (const ct of CONTENT_TYPE_TRANSLATIONS) {
  for (const rel of ct.bpmnDiagrams ?? []) {
    if (!existsSync(join(root, rel))) missingDeclared.push(`${ct.contentType} → ${rel}`);
  }
}
// Same class again: a format may declare the modules that implement its
// extract and inject. `bpmn` declared NEITHER while its note described a
// working re-render, so the capability read as built and was not.
for (const ct of CONTENT_TYPE_TRANSLATIONS) {
  for (const f of ct.formats) {
    for (const rel of [f.extractModule, f.injectModule]) {
      if (rel && !existsSync(join(root, rel))) {
        missingDeclared.push(`${ct.contentType}/${f.id} → ${rel}`);
      }
    }
  }
}

if (missingDeclared.length) {
  console.log("\nDECLARED BUT ABSENT — translation-tools names a file that is not there:");
  for (const m of missingDeclared) console.log(`  \u2717 ${m}`);
}

/*
 * Every diagram is reachable from the index page. Measured 2026-09-18: the
 * page opened "Nineteen BPMN 2.0 files" and then listed EIGHT — eleven
 * diagrams existed and were invisible to any reader who started there. A
 * diagram nobody can find is only marginally better than one that does not
 * exist, and the miscount proves the list was not maintained alongside the
 * directory.
 */
const INDEX_DIR = join(root, "content/docs/publication-workflow");
const unindexed: string[] = [];
if (existsSync(INDEX_DIR)) {
  const indexText = readdirSync(INDEX_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => readFileSync(join(INDEX_DIR, f), "utf-8"))
    .join("\n");
  for (const f of files) if (!indexText.includes(f)) unindexed.push(f);
}
if (unindexed.length) {
  console.log("\nNOT INDEXED — a diagram no reader of the workflow page can find:");
  for (const f of unindexed) console.log(`  \u2717 ${f}`);
}

if (dangling.length || missingDeclared.length || unindexed.length) process.exit(1);
if (strict && totalUncovered) process.exit(1);
