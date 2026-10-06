/**
 * `workflow-skill-refs` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/workflow-skill-refs.test.ts` (bean `7zz1`, owner
 * ruling 2026-10-06 "Top-level instance"): each resolves every instance's
 * declared diagrams, which only the checkout holds. Standing alone,
 * cat-harness has none of it, and `check:cat-harness-standalone` collects
 * every test in that layer. The rest of that file's tests stay there; every
 * path here is composed from ORIGIN_DIR, the directory they were written in,
 * so nothing they read changed.
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

const ROOT = join(ORIGIN_DIR, "../..");

describe("declared diagram paths resolve", () => {
  test("every bpmnDiagrams entry names a file that exists", async () => {
    // Same failure one layer over. `schemas/translation-tools.ts` listed
    // `processes/publication-workflow.bpmn`, which has never existed —
    // `docs/process/publication-workflow.md` is a PAGE embedding three diagrams. The
    // re-render skipped it silently, and a skipped diagram is
    // indistinguishable from one that needed no work.
    const { CONTENT_TYPE_TRANSLATIONS } = await import("../cat-harness/schemas/translation-tools.ts");
    const missing: string[] = [];
    for (const ct of CONTENT_TYPE_TRANSLATIONS) {
      for (const rel of ct.bpmnDiagrams ?? []) {
        if (!existsSync(join(ROOT, rel))) missing.push(`${ct.contentType} → ${rel}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
