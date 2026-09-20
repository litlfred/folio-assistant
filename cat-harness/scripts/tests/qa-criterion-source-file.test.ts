/**
 * A criterion's declared `source_file` must be the file that actually
 * contains its checker.
 *
 * ## Why this test exists
 *
 * `getCriterionSourceFile()` resolves the path that `script_hash` is computed
 * over. That hash is the ONLY thing that makes a cached sidecar verdict go
 * stale when checker logic changes (`schemas/block-qa.ts` →
 * `QaReviewer.script_hash`).
 *
 * So a criterion pointed at a file that does not contain its checker never
 * invalidates. Its verdicts stay "fresh" indefinitely, and editing the real
 * checker changes nothing — the sweep keeps serving the answer it cached.
 * There is no error, no warning, and no symptom except a number that will
 * not move. A wrong `pass` is believed; a verdict that CANNOT GO STALE is
 * worse, because nothing about it ever looks wrong.
 *
 * Measured on `main`, 2026-09-18 (bean `b7yo`): 11 of 59 automated criteria
 * were in that state. Found by accident — a fix to `checkAuthorNotesPollution`
 * did not change its verdict, because the sidecar was hashing a file the fix
 * never touched.
 *
 * ## Why the candidate list is globbed, not written down
 *
 * The first version of this test hard-coded seven checker files. There are
 * TEN. `qa-checkers-render.ts`, `qa-checkers-q-usage.ts` and
 * `qa-checkers-vacuity.ts` were absent, so every criterion in them read as
 * "dispatcher not found" and was waved through — and that silence hid THREE
 * REAL MISMATCHES (`lean-no-vacuous-instance-data`,
 * `lean-no-definitional-laundering`, `lean-docstring-honesty`, all
 * dispatching from `qa-checkers-vacuity.ts` while declaring
 * `qa-checkers-extended.ts`).
 *
 * That is the same defect the test was written to catch — an allow-list that
 * falls through silently — reproduced in the guard itself. Hence the glob: a
 * checker file added tomorrow is covered without anyone remembering to add
 * it. Bean `fg6z`.
 *
 * ## Two dispatch styles, both covered
 *
 * 1. a dispatch-table entry keyed `"<criterion-id>":` (the voice / DAK / uses
 *    checkers); and
 * 2. an exported `check<PascalCaseId>` function called by name — how the ten
 *    `script-quality` Python criteria work. Probing only for (1) reported all
 *    ten as unlocatable when their `source_file` was in fact correct.
 *
 * Run via `bun test`.
 */
import { describe, test, expect } from "bun:test";
import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve } from "path";

import {
  QA_CRITERIA_REGISTRY,
  getCriterionSourceFile,
} from "../../content/pipeline/qa-criteria-registry.ts";
import { checkerFunctionName } from "../../content/pipeline/qa-checker-discovery.ts";

const ROOT = resolve(import.meta.dir, "../..");
const CHECKER_DIR = "content/pipeline";

/** Every `qa-checkers-*.ts`, discovered rather than listed. */
function checkerFiles(): string[] {
  const dir = resolve(ROOT, CHECKER_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /^qa-checkers-.*\.ts$/.test(f))
    .map((f) => `${CHECKER_DIR}/${f}`)
    .sort();
}

const sources = new Map<string, string>(
  checkerFiles().map((f) => [f, readFileSync(resolve(ROOT, f), "utf-8")]),
);

// The name convention is `qa-checker-discovery`'s, not this test's: discovery
// RESOLVES checkers by it at runtime, so a second copy here could drift and
// the drift would read as a passing test over a sweep that finds nothing.
const checkerFnName = checkerFunctionName;

/**
 * Files that contain `id`'s checker, by either dispatch style. Returns []
 * when none does — a real third state, reported rather than treated as
 * agreement.
 */
function hostFiles(id: string): string[] {
  const fn = checkerFnName(id);
  const out: string[] = [];
  for (const [f, s] of sources) {
    if (s.includes(`"${id}":`) || s.includes(`export function ${fn}(`)) out.push(f);
  }
  return out;
}

const automated = QA_CRITERIA_REGISTRY.filter((d) => d.automated);

describe("getCriterionSourceFile — declared source must host the checker", () => {
  test("the glob finds the checker files", () => {
    // Guards the guard. A renamed directory would otherwise leave every
    // criterion "undetermined" and let this suite pass on an empty set —
    // exactly how the hard-coded list hid three mismatches.
    expect(sources.size).toBeGreaterThanOrEqual(10);
  });

  test("there are automated criteria to check", () => {
    expect(automated.length).toBeGreaterThan(40);
  });

  test("every locatable automated criterion is hashed against its own file", () => {
    const mismatched: string[] = [];
    for (const def of automated) {
      const declared = getCriterionSourceFile(def.id);
      const hosts = hostFiles(def.id);
      if (hosts.length === 0) continue; // reported separately below
      if (!hosts.includes(declared)) {
        mismatched.push(`${def.id}: declared ${declared}, found in ${hosts.join(", ")}`);
      }
    }
    // Named in the failure so a fix does not need a re-run to find them.
    expect(mismatched).toEqual([]);
  });

  test("an automated criterion with NO checker anywhere is a defect, not a pass", () => {
    // `qa-sweep` resolves `AUTOMATED_CHECKERS[id] ?? DAK_AUTOMATED_CHECKERS[id]`
    // and falls through to `needs-agent` when undefined. So `automated: true`
    // with no checker silently bills an agent adjudication for a check nobody
    // wrote, and is indistinguishable downstream from `automated: false`.
    //
    // `proof-no-placeholder-stub` was in exactly that state and is now
    // declared `automated: false`, which is what the runtime already did.
    const orphans = automated.filter((d) => hostFiles(d.id).length === 0);
    expect(orphans.map((d) => d.id)).toEqual([]);
  });
});
