import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { loadProcessModel } from "../../src/workflow/process-model";
import {
  loadRelaxations,
  PolicyError,
  validateRelaxations,
} from "../../src/workflow/gate";
import { workflowFile } from "../known-skills.ts";

/** The harness root; diagrams are found by NAME through its declared `processes` graphs (bean `63wl`). */
const HARNESS = resolve(import.meta.dir, "../..");

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
const INSTANCE_ROOT = resolve(import.meta.dir, "../..");

describe("the base is strict and the content-type processes are not", () => {
  test("the three per-content-type processes are advisory", async () => {
    for (const f of ["authoring-a-paper", "l2-dak-authoring", "l3-fhir-pipeline"]) {
      expect((await loadProcessModel(processFile(f))).enforcement).toBe("advisory");
    }
  });

});

describe("reading the package policy files", () => {
  test("a relaxation with no reason does not load", () => {
    const repo = mkdtempSync(join(tmpdir(), "policy-"));
    mkdirSync(join(repo, "skills", "pkg"), { recursive: true });
    // A PACKAGE HOLDS A SKILL. The policy files are read from the packages
    // discovery finds, and a directory holding no skill is not one (bean 9umr).
    writeFileSync(join(repo, "skills", "pkg", "a-skill.md"), "# A skill\n");
    writeFileSync(
      join(repo, "skills", "pkg", "workflow-policy.json"),
      JSON.stringify({ relaxations: [{ process: "Process_Editing", activity: "Task_SmeReview" }] }),
    );
    // An unexplained relaxation is a loophole, not a policy.
    expect(() => loadRelaxations(repo)).toThrow(PolicyError);
    expect(() => loadRelaxations(repo)).toThrow(/reason/);
    rmSync(repo, { recursive: true, force: true });
  });

  test("a policy file claiming to be a different package does not load", () => {
    const repo = mkdtempSync(join(tmpdir(), "policy-"));
    mkdirSync(join(repo, "skills", "pkg"), { recursive: true });
    // A PACKAGE HOLDS A SKILL. The policy files are read from the packages
    // discovery finds, and a directory holding no skill is not one (bean 9umr).
    writeFileSync(join(repo, "skills", "pkg", "a-skill.md"), "# A skill\n");
    writeFileSync(
      join(repo, "skills", "pkg", "workflow-policy.json"),
      JSON.stringify({ package: "somewhere-else", relaxations: [] }),
    );
    expect(() => loadRelaxations(repo)).toThrow(/declares package/);
    rmSync(repo, { recursive: true, force: true });
  });

  test("a package with no policy file relaxes nothing", () => {
    const repo = mkdtempSync(join(tmpdir(), "policy-"));
    mkdirSync(join(repo, "skills", "quiet"), { recursive: true });
    expect(loadRelaxations(repo)).toEqual([]);
    rmSync(repo, { recursive: true, force: true });
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
