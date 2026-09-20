#!/usr/bin/env bun
/**
 * Measure the `crdm-detect` phrase signals against real issues.
 *
 * The CRDM page claimed the detection skill existed; nobody had ever checked
 * whether it FIRES correctly, so the honest claim was "the guidance exists",
 * not "detection works". This turns that into a number.
 *
 * ## What this measures, and what it does not
 *
 * `skills/folio-core/crdm-detect.md` is prose for a model to read. It lists
 * five categories of phrasing plus an explicit "what is NOT a feature request"
 * list. This script implements the PHRASE SIGNALS mechanically. That makes it
 * a LOWER BOUND on an agent that also applies judgement — an agent can catch a
 * feature request phrased in words the list never anticipated, and can decline
 * one whose phrasing matches but whose substance does not.
 *
 * So: a low recall here means the phrase list is thin, not necessarily that
 * the skill fails. A low precision here is more damning, because a phrase that
 * fires on a bug report will push a model toward the wrong branch too.
 *
 * ## The ground truth is one annotator's, unblinded
 *
 * `scripts/eval/crdm-detect-corpus.json` carries all 27 issues in this
 * repository — the whole population, not a sample — each labelled with a
 * one-line reason. The labels were written by the same agent that wrote this
 * script, without a second annotator and without blinding. That is a real
 * weakness and is the first thing to fix before quoting these numbers as a
 * property of the skill rather than of this corpus.
 *
 * Usage: bun run eval:crdm-detect [--verbose]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { buildTestRun, hashesReproduce, TestRunSchema } from "../schemas/test-run.ts";

const root = resolve(import.meta.dir, "..");
const verbose = process.argv.includes("--verbose");

interface Item { number: number; title: string; isFeature: boolean; why: string; text: string }

/** The five categories from crdm-detect.md, as matchable patterns. */
const CATEGORIES: { name: string; patterns: RegExp[] }[] = [
  {
    name: "direct-capability",
    patterns: [
      /\bi need a way to\b/i, /\bcan you add\b/i, /\bwe need a tool\b/i, /\bneed some tooling\b/i,
      /\bthere should be a skill\b/i, /\badd a QA check\b/i, /\bshould support\b/i,
      /\bmake the pipeline\b/i, /\bnew block kind\b/i, /\bneed a content type\b/i,
      /\bit would be great if\b/i, /\bbuild me\b/i, /\bcreate a tool\b/i, /\bdevelop a feature\b/i,
      /\bwe need to have\b/i, /\bwe (?:also )?need to\b/i,
    ],
  },
  {
    name: "workflow-gap",
    patterns: [
      /\bright now i have to\b/i, /\bthere is no way to\b/i, /\bcurrent process\b/i,
      /\bdoes ?n[o']?t handle\b/i, /\bcan[' ]?t do\b/i, /\bit'?s missing\b/i,
      /\bdoes ?n[o']?t support\b/i, /\bevery time i\b/i, /\bneed to be able to\b/i,
    ],
  },
  {
    name: "platform-change",
    patterns: [
      /\bchange the schema\b/i, /\bmodify the pipeline\b/i, /\badd a new adapter\b/i,
      /\bthe constraint should\b/i, /\bupdate the CI\b/i, /\bworkflow should fire\b/i,
      /\bMCP tool\b/i, /\bregister a new tool\b/i, /\bmigrate\b/i, /\bdeprecat/i,
      /\b(?:schemas|content\/pipeline|adapters|scripts|\.github\/workflows)\//,
    ],
  },
  {
    name: "cross-cutting",
    patterns: [
      /\bfor all papers\b/i, /\bevery folio\b/i, /\bacross all content types\b/i,
      /\bthe platform should\b/i, /\bboth document and paper\b/i, /\bwrit large\b/i,
    ],
  },
  {
    name: "review-surfaced",
    patterns: [
      /\bwould be easier if\b/i, /\btriage these comments\b/i, /\bfeedback workflow\b/i,
      /\bstakeholders need\b/i, /\breview process more\b/i, /\bfor comment review\b/i,
    ],
  },
];

/** The skill's explicit exclusions. */
const EXCLUSIONS: RegExp[] = [
  /\bwrite the next section\b/i,
  /\bfix the typo\b/i,
  /\brun content_validate\b/i,
  /\breview chapter\b/i,
  /\bcreate a bean\b/i,
];

interface Verdict { fires: boolean; categories: string[]; excluded: boolean }

function detect(text: string): Verdict {
  const categories = CATEGORIES.filter((c) => c.patterns.some((p) => p.test(text))).map((c) => c.name);
  const excluded = EXCLUSIONS.some((p) => p.test(text));
  return { fires: categories.length > 0 && !excluded, categories, excluded };
}

const corpus: Item[] = JSON.parse(
  readFileSync(join(root, "scripts/eval/crdm-detect-corpus.json"), "utf-8"),
);

let tp = 0, fp = 0, tn = 0, fn = 0;
const misses: Item[] = [];
const falseAlarms: Item[] = [];

for (const item of corpus) {
  const v = detect(item.text);
  if (item.isFeature && v.fires) tp++;
  else if (item.isFeature && !v.fires) { fn++; misses.push(item); }
  else if (!item.isFeature && v.fires) { fp++; falseAlarms.push(item); }
  else tn++;

  if (verbose) {
    const mark = item.isFeature === v.fires ? "✓" : "✗";
    console.log(
      `  ${mark} #${String(item.number).padEnd(4)} truth=${item.isFeature ? "feature " : "not     "}` +
        `fired=${v.fires ? "yes" : "no "}  ${v.categories.join("+") || "(none)"}`,
    );
  }
}

const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

console.log(`\ncrdm-detect phrase signals · ${corpus.length} issues (whole population)\n`);
console.log(`                 fired    did not`);
console.log(`  is feature      ${String(tp).padStart(3)}       ${String(fn).padStart(3)}`);
console.log(`  is not          ${String(fp).padStart(3)}       ${String(tn).padStart(3)}`);
console.log(`\n  precision ${pct(precision)}   recall ${pct(recall)}   F1 ${pct(f1)}`);

if (misses.length) {
  console.log(`\nMISSED — a feature request no phrase caught (${misses.length}):`);
  for (const m of misses) console.log(`  · #${m.number} ${m.title.slice(0, 68)}\n      ${m.why}`);
}
if (falseAlarms.length) {
  console.log(`\nFALSE ALARM — fired on something that is not a feature request (${falseAlarms.length}):`);
  for (const f of falseAlarms) console.log(`  · #${f.number} ${f.title.slice(0, 68)}\n      ${f.why}`);
}

console.log(
  `\nLOWER BOUND. This runs the phrase list only; the skill also asks for\n` +
    `judgement, which catches wording the list never anticipated. Ground truth\n` +
    `is ONE annotator's, unblinded — fix that before quoting these as a\n` +
    `property of the skill rather than of this corpus.`,
);

// ─── The run is RECORDED, not only printed ──────────────────────────────────
//
// Bean `folio-assistant-zz0a`. Everything above this line went to stdout and
// nowhere else, so nobody could tell "recall was always 65%" from "this commit
// dropped it" — the same argument that put QA verdicts in committed sidecars
// rather than a console report.
//
// Two hashes, because "what was tested" and "what tested it" are different
// questions. `buildTestRun` refuses if the two bases overlap, so the
// independence is a property of this call rather than a claim in a comment:
// the corpus is the DATA, the runner and the skill it implements are the
// PROCESS. The skill is in the process basis deliberately — it is what the
// phrase list is derived FROM, so editing it can change the result without
// touching a line of this script, which is exactly the `cv10` failure.
const OUT = join(root, "test/results/crdm-detect-eval.test-run.json");
const run = buildTestRun({
  root,
  subject: "crdm-detect phrase signals against the issue corpus",
  dataInputs: ["scripts/eval/crdm-detect-corpus.json"],
  processInputs: ["scripts/eval-crdm-detect.ts", "skills/folio-core/crdm-detect.md"],
  outcome: {
    population: corpus.length,
    truePositives: tp,
    falsePositives: fp,
    trueNegatives: tn,
    falseNegatives: fn,
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    f1: Number(f1.toFixed(4)),
  },
});

// Same churn guard as `writeQaResult`: an unchanged run keeps its file and its
// timestamp, so `updated_at` says when these numbers were ESTABLISHED rather
// than when somebody last ran the script.
let priorSaysSame = false;
try {
  const prior = TestRunSchema.parse(JSON.parse(readFileSync(OUT, "utf-8")));
  const { updated_at: _a, ...restPrior } = prior;
  const { updated_at: _b, ...restNow } = run;
  priorSaysSame = JSON.stringify(restPrior) === JSON.stringify(restNow);
  const repro = hashesReproduce(prior, run);
  if (!repro.both) {
    console.log(
      `\nCHANGED since the recorded run:` +
        `${repro.data ? "" : "\n  · the DATA — the corpus is not the one that produced it"}` +
        `${repro.process ? "" : "\n  · the PROCESS — the runner or the skill it implements"}`,
    );
  }
} catch {
  // No prior run, or an unreadable one. Either way: write.
}
if (!priorSaysSame) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(run, null, 2) + "\n");
}
console.log(`\nTest run → test/results/crdm-detect-eval.test-run.json`);
console.log(`  data    ${run.data.hash}  over ${run.data.inputs.length} input(s)`);
console.log(`  process ${run.process.hash}  over ${run.process.inputs.length} input(s)`);
