/**
 * `workflow-gate` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/workflow-gate.test.ts` (bean `7zz1`, owner ruling
 * 2026-10-06 "Top-level instance"): each reads the content-type processes
 * folio-assistant-core and -sci ship, which only the checkout holds. Standing
 * alone, cat-harness has none of it, and `check:cat-harness-standalone`
 * collects every test in that layer. The rest of that file's tests stay there;
 * every path here is composed from ORIGIN_DIR, the directory they were written
 * in, so nothing they read changed.
 */
import { describe, expect, test } from "bun:test";
import { join, resolve } from "path";
import { loadProcessModel } from "../cat-harness/src/workflow/process-model";
import {
  loadRelaxations,
  validateRelaxations,
} from "../cat-harness/src/workflow/gate";
import { workflowFile } from "../cat-harness/scripts/known-skills.ts";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

/** The harness root; diagrams are found by NAME through its declared `processes` graphs (bean `63wl`). */
const HARNESS = resolve(ORIGIN_DIR, "../..");

/**
 * The decision in bean `bcnl`: **strict at the base, relaxable by content
 * packages that say so.**
 *
 * The content-agnostic processes enforce. A per-content-type process is
 * advisory, because what counts as adequate review of a Lean proof and of a
 * FHIR profile are different questions and the package that knows the domain
 * should answer them.
 *
 * What makes that a policy rather than a loophole is what these tests pin: a
 * relaxation needs a stated reason, it must name something real, and it cannot
 * name the gate itself.
 *
 * The tests that pin folio-assistant-core's OWN diagrams (`editing-hci-validation`,
 * `draft-to-publication`, `content-lifecycle`) live beside them, in
 * `folio-assistant-core/scripts/tests/workflow-gate.test.ts`, and the advisory
 * run of `authoring-a-paper` in folio-assistant-sci's (bean `ho66`).
 */

/**
 * Where a shipped diagram lives. Not one directory: a content-type process is
 * held by the instance that owns its skills (`l2-dak-authoring` in smart-base,
 * #1772; the paper and document processes since placement PR3, bean `63wl`),
 * and each instance groups its diagrams by concern. So a diagram is found by
 * NAME through the declared `processes` graphs.
 */
const processFile = (f: string): string => workflowFile(HARNESS, `${f}.bpmn`);
const INSTANCE_ROOT = resolve(ORIGIN_DIR, "../..");

describe("the base is strict and the content-type processes are not", () => {
  test("the three per-content-type processes are advisory", async () => {
    for (const f of ["authoring-a-paper", "l2-dak-authoring", "l3-fhir-pipeline"]) {
      expect((await loadProcessModel(processFile(f))).enforcement).toBe("advisory");
    }
  });

});

describe("the relaxations this repo actually ships", () => {
  test("all of them are legal against the real processes", async () => {
    const models = await Promise.all(
      ["editing-hci-validation", "draft-to-publication", "content-lifecycle",
       "authoring-a-paper", "l2-dak-authoring", "l3-fhir-pipeline"].map((f) =>
        loadProcessModel(processFile(f)),
      ),
    );
    const relaxations = loadRelaxations(INSTANCE_ROOT);
    expect(() => validateRelaxations(relaxations, models)).not.toThrow();
    // Every one is attributed and explained — the file is the record.
    for (const r of relaxations) {
      expect(r.package).toBeTruthy();
      expect(r.reason.length).toBeGreaterThan(20);
    }
  });
});
