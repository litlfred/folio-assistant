/**
 * A criterion's declared `source_file` must be the file that actually
 * dispatches it.
 *
 * ## Why this test exists
 *
 * `getCriterionSourceFile()` resolves the path that `script_hash` is
 * computed over. That hash is the ONLY thing that makes a cached sidecar
 * verdict go stale when checker logic changes
 * (`schemas/block-qa.ts` → `QaReviewer.script_hash`).
 *
 * So a criterion pointed at a file that does not contain its checker never
 * invalidates. Its verdicts stay "fresh" indefinitely, and editing the real
 * checker changes nothing — the sweep keeps serving the answer it cached
 * before the fix. There is no error, no warning, and no symptom except a
 * number that will not move.
 *
 * Measured on `main`, 2026-09-18: **11 of 59** automated criteria were in
 * that state — six voice/cite criteria and all five `dak-*`. The resolver
 * falls through to `EXTENDED_CHECKER_FILE` for anything it does not
 * recognise, so every checker added to a NEW file silently joined them.
 *
 * It was found by accident: a fix to `checkAuthorNotesPollution` (which
 * lives in `qa-checkers-voice.ts`) did not change its verdict, because the
 * sidecar was hashing `qa-checkers-extended.ts`. Without this test the next
 * one is found the same way, or not at all.
 *
 * Run via `bun test`.
 */
import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

import {
  QA_CRITERIA_REGISTRY,
  getCriterionSourceFile,
} from "../../content/pipeline/qa-criteria-registry.ts";

const ROOT = resolve(import.meta.dir, "../..");

/** Every file that could host a checker dispatch table. */
const CANDIDATES = [
  "content/pipeline/qa-checkers-voice.ts",
  "content/pipeline/qa-checkers-extended.ts",
  "content/pipeline/qa-checkers-uses.ts",
  "content/pipeline/qa-checkers-python.ts",
  "content/pipeline/qa-checkers-dak.ts",
  "content/pipeline/qa-checkers-cost.ts",
  "content/pipeline/qa-checkers-triviality.ts",
];

const sources = new Map<string, string>();
for (const f of CANDIDATES) {
  const p = resolve(ROOT, f);
  if (existsSync(p)) sources.set(f, readFileSync(p, "utf-8"));
}

/**
 * Which candidate files dispatch `id`, keyed on the `"<id>":` entry every
 * dispatch table uses. Returns [] when none does — a real third state,
 * reported rather than treated as agreement.
 */
function dispatchFiles(id: string): string[] {
  const out: string[] = [];
  for (const [f, s] of sources) if (s.includes(`"${id}":`)) out.push(f);
  return out;
}

const automated = QA_CRITERIA_REGISTRY.filter((d) => d.automated);

describe("getCriterionSourceFile — declared source must host the dispatcher", () => {
  test("the candidate list itself resolves to real files", () => {
    // Guards the guard: a renamed checker file would otherwise make every
    // criterion "undetermined" and this suite would pass on an empty set.
    expect(sources.size).toBeGreaterThanOrEqual(5);
  });

  test("there are automated criteria to check", () => {
    expect(automated.length).toBeGreaterThan(40);
  });

  test("every locatable automated criterion is hashed against its own file", () => {
    const mismatched: string[] = [];
    for (const def of automated) {
      const declared = getCriterionSourceFile(def.id);
      const actual = dispatchFiles(def.id);
      if (actual.length === 0) continue; // reported separately below
      if (!actual.includes(declared)) {
        mismatched.push(`${def.id}: declared ${declared}, dispatched from ${actual.join(", ")}`);
      }
    }
    // Named in the failure so the fix does not need a re-run to find them.
    expect(mismatched).toEqual([]);
  });

  test("a criterion whose dispatcher cannot be located is NOT silently accepted", () => {
    // These are criteria the string probe cannot resolve — dispatched
    // dynamically, or through a table this test does not know about. They
    // are not failures, but the count is pinned: if it grows, a new
    // dispatch mechanism appeared and this test stopped covering it.
    //
    // Baseline measured 2026-09-18 on the command `bun test`.
    const unlocatable = automated.filter((d) => dispatchFiles(d.id).length === 0);
    expect(unlocatable.length).toBeLessThanOrEqual(18);
  });
});
