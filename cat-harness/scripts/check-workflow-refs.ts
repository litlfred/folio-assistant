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
import { workflowFiles } from "./known-skills.js";
import { basename, join, relative, resolve } from "node:path";
import { loadProcessModel, isActivity } from "../src/workflow/process-model.js";
import { knownSkills } from "./known-skills.js";

interface Dangling { file: string; node: string; ref: string }
interface Coverage { file: string; covered: number; total: number; uncovered: string[] }

const INSTANCE_ROOT = resolve(import.meta.dir, "..");
const strict = process.argv.includes("--strict");

/**
 * Every instance whose diagrams this repository is responsible for.
 *
 * Root-only until 2026-09-19, and the comment below is the argument for the
 * change: *"a dangling `<folio:skill ref>` in a diagram this checker never
 * opens is a broken reference reported as clean."* `bootstrap/` is a separate
 * instance with its own declaration and its own two skills, so
 * `bootstrap/processes/bootstrap.bpmn` was in exactly that state from the day
 * it was written — unchecked, and reported clean by a checker scoped to
 * somebody else's graph.
 *
 * Each instance's refs resolve against ITS OWN skills, never the union: a
 * bootstrap diagram naming a harness skill is a real dangling ref, because
 * bootstrap runs before the harness exists.
 */
const INSTANCES = [INSTANCE_ROOT, join(INSTANCE_ROOT, "bootstrap")];

const dangling: Dangling[] = [];
const coverage: Coverage[] = [];

/**
 * Every exclusive gateway, split by who chooses the branch.
 *
 * **The question this exists to make answerable is bean `q0tc`'s** — how much
 * of a workflow must be deterministic, and which judgement points are safety
 * risks. That cannot be asked of a corpus that cannot enumerate its own
 * judgement points, and until `folio:judgement` landed it could not: a gateway
 * with no decision table was either somebody's call or an unwritten table, and
 * nothing told them apart.
 *
 * Issue #200 §6 classified all ten of this repository's decision points in
 * PROSE, in an issue. This is the same classification where something reads
 * it.
 *
 * REPORTED, not enforced. `undeclared` is a real backlog rather than a defect
 * to fail on: every gateway that predates the marker lands there, and a gate
 * that fails on a corpus nobody has annotated yet is a gate somebody turns
 * off. It is printed so the number is visible and shrinking.
 */
const branches = {
  computed: [] as Array<{ file: string; node: string }>,
  judgement: [] as Array<{ file: string; node: string }>,
  undeclared: [] as Array<{ file: string; node: string }>,
};

/**
 * Every call into a process that JUDGES, and whether the caller says which
 * answers it can act on. Bean `bvuk`.
 *
 * REPORTED, not enforced, and the reason is specific rather than the usual
 * adoption argument. Six diagrams call `Process_Adjudication`; **none of them
 * branches on its outcome** — each call activity has one outgoing flow and the
 * called process one settled end event — so the mismatch is invisible in the
 * diagram's shape. Four of the six ask it a question its three QA-criterion
 * outcomes do not obviously answer (`refresh-materialized` asks *which side
 * wins* a conflict), and what each of those four SHOULD accept is an open
 * decision, not a backfill.
 *
 * So an undeclared caller is "could not determine", printed rather than
 * failed. A DECLARED one that disagrees with its judge is refused at load, by
 * `checkAcceptedCodes` in `process-model.ts` — this list is the third state
 * between that refusal and silence.
 */
const adjudicationCalls = {
  declared: [] as Array<{ file: string; node: string; codes: string[] }>,
  undeclared: [] as Array<{ file: string; node: string; called: string }>,
};

let knownCount = 0;
let fileCount = 0;
let rootFiles: string[] = [];

for (const root of INSTANCES) {
const skills = knownSkills(root);
knownCount += skills.size;
// Absolute paths from every declared directory. A dangling `<folio:skill
// ref>` in a diagram this checker never opens is a broken reference reported
// as clean, which is the exact failure this script exists to prevent.
const files = workflowFiles(root).filter((f) => f.endsWith(".bpmn"));
fileCount += files.length;
// The sections after this loop are about the ROOT instance only — its
// content-type translation declarations and its publication index.
if (root === INSTANCE_ROOT) rootFiles = files;


for (const file of files) {
  const model = await loadProcessModel(file);
  const activities = [...model.nodes.values()].filter(isActivity);
  const uncovered: string[] = [];

  for (const node of activities) {
    const refs = node.skills ?? [];
    if (refs.length === 0) uncovered.push(node.id);
    for (const ref of refs) {
      if (!skills.has(ref)) dangling.push({ file: relative(INSTANCE_ROOT, file), node: node.id, ref });
    }
  }
  coverage.push({
    file: relative(INSTANCE_ROOT, file),
    covered: activities.length - uncovered.length,
    total: activities.length,
    uncovered,
  });

  // Every exclusive gateway, by WHO decides it. Counted here rather than in a
  // checker of its own because this loop already has the model, and a second
  // loader is a second answer to which diagrams exist.
  for (const node of model.nodes.values()) {
    if (node.kind !== "exclusive") continue;
    const where = { file: relative(INSTANCE_ROOT, file), node: node.id };
    if (node.decisionRef) branches.computed.push(where);
    else if (node.judgementReason) branches.judgement.push(where);
    else branches.undeclared.push(where);
  }

  // Calls into a judging process. `model.children` is what the loader already
  // resolved, so a call OUT of this corpus is absent here rather than counted
  // — a process no file defines is opaque by design and cannot be checked.
  for (const [nodeId, child] of model.children) {
    if (![...child.nodes.values()].some((n) => n.adjudication !== undefined)) continue;
    const node = model.nodes.get(nodeId)!;
    const where = { file: relative(INSTANCE_ROOT, file), node: nodeId };
    if (node.adjudicationAccepts) {
      adjudicationCalls.declared.push({ ...where, codes: node.adjudicationAccepts });
    } else {
      adjudicationCalls.undeclared.push({ ...where, called: child.id });
    }
  }
}
}

console.log(`Workflow skill refs  (${knownCount} skills known across ${INSTANCES.length} instances, ${fileCount} diagrams)\n`);

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

const adjTotal = adjudicationCalls.declared.length + adjudicationCalls.undeclared.length;
if (adjTotal > 0) {
  console.log(
    `\nAdjudication callers — ${adjudicationCalls.declared.length} of ${adjTotal} say ` +
      `which answers they can act on`,
  );
  for (const d of adjudicationCalls.declared) {
    console.log(`  \u2713 ${d.file} \u00b7 ${d.node} accepts (${d.codes.join(", ")})`);
  }
  for (const u of adjudicationCalls.undeclared) {
    console.log(`  ? ${u.file} \u00b7 ${u.node} \u2192 ${u.called}: does not say`);
  }
  if (adjudicationCalls.undeclared.length) {
    console.log(
      `\n${adjudicationCalls.undeclared.length} caller(s) run a judgement without saying which of\n` +
        `its answers they can act on. Not an error — what each should accept is the open\n` +
        `question in bean \`bvuk\`, and guessing one would make an undecided thing look\n` +
        `checked. Add <folio:adjudication accepts="…"/> once the answer is decided.`,
    );
  }
}

/*
 * The same failure, one layer over: `schemas/translation-tools.ts` lists
 * `bpmnDiagrams` per content type — the diagrams whose labels need
 * re-rendering after translation. One entry named
 * `processes/publication-workflow.bpmn`, which has never existed, so the
 * re-render skipped it silently and a skipped diagram is indistinguishable
 * from a diagram that needed no work.
 */
const { CONTENT_TYPE_TRANSLATIONS } = await import("../schemas/translation-tools.js");
const missingDeclared: string[] = [];
for (const ct of CONTENT_TYPE_TRANSLATIONS) {
  for (const rel of ct.bpmnDiagrams ?? []) {
    if (!existsSync(join(INSTANCE_ROOT, rel))) missingDeclared.push(`${ct.contentType} → ${rel}`);
  }
}
// Same class again: a format may declare the modules that implement its
// extract and inject. `bpmn` declared NEITHER while its note described a
// working re-render, so the capability read as built and was not.
for (const ct of CONTENT_TYPE_TRANSLATIONS) {
  for (const f of ct.formats) {
    for (const rel of [f.extractModule, f.injectModule]) {
      if (rel && !existsSync(join(INSTANCE_ROOT, rel))) {
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
const INDEX_DIR = join(INSTANCE_ROOT, "content/docs/publication-workflow");
const unindexed: string[] = [];
if (existsSync(INDEX_DIR)) {
  const indexText = readdirSync(INDEX_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => readFileSync(join(INDEX_DIR, f), "utf-8"))
    .join("\n");
  // The page names diagrams by BASENAME (`crdm-close.bpmn`), so that is what
  // is matched — but only where the basename is unambiguous. Under a topical
  // layout `bootstrap/processes/review.bpmn` and `crdm/workflows/review.bpmn`
  // share one, and a single mention of `review.bpmn` indexes NEITHER: a
  // reader who follows it reaches one diagram and cannot tell which. Such a
  // diagram must be named by its repo-relative path to count.
  //
  // `workflowFiles` returns ABSOLUTE paths, and comparing those against prose
  // was a live defect for one commit — `ab62c9dfe` rewired this checker to the
  // declaration and left the comparison alone, so all 32 diagrams read as
  // unindexed. A wall of false findings is the failure mode `known-skills.ts`
  // names: a check that cries wolf is a check somebody switches off.
  const byBase = new Map<string, number>();
  for (const f of rootFiles) byBase.set(basename(f), (byBase.get(basename(f)) ?? 0) + 1);
  for (const f of rootFiles) {
    const rel = relative(INSTANCE_ROOT, f);
    const base = basename(f);
    const named = indexText.includes(rel) || (byBase.get(base) === 1 && indexText.includes(base));
    if (!named) unindexed.push(rel);
  }
}
if (unindexed.length) {
  console.log("\nNOT INDEXED — a diagram no reader of the workflow page can find:");
  for (const f of unindexed) console.log(`  \u2717 ${f}`);
}

console.log(
  `\nDecision points — ${branches.computed.length} computed by a DMN table, ` +
    `${branches.judgement.length} declared judgement, ${branches.undeclared.length} undeclared.`,
);
if (branches.undeclared.length) {
  console.log(
    "  An undeclared gateway is not a defect — it predates `folio:judgement` —\n" +
      "  but it is a decision point nobody has said is a JUDGEMENT rather than a\n" +
      "  table nobody wrote. Bean `q0tc` needs the difference.",
  );
  for (const g of branches.undeclared.slice(0, 8)) console.log(`  \u00b7 ${g.file}: ${g.node}`);
  if (branches.undeclared.length > 8) {
    console.log(`  \u00b7 …and ${branches.undeclared.length - 8} more`);
  }
}

if (dangling.length || missingDeclared.length || unindexed.length) process.exit(1);
if (strict && totalUncovered) process.exit(1);
