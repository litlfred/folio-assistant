/**
 * One graph per declared instance — bean `4ak5` items 1 and 5.
 *
 * The workflow literals below are fixture text on purpose (bean `jijc`): a
 * matcher fed a constant it was built from asserts nothing.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { DEPLOY_WORKFLOW, incompleteExports, publishedInstances } from "../check-published-instance-exports.js";
import { PUBLISHED_ELSEWHERE, declaredInstanceStubs, instanceExportPlan, type PlannedExport } from "../instance-exports.js";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const wf = (n: string) => readFileSync(join(REPO, ".github", "workflows", n), "utf-8");

/** A workflow body that runs every publisher, minus whatever `drop` names. */
function workflow(drop: string[] = []): string {
  const lines: Record<string, string> = {
    plan: "          bun run cat-harness/scripts/instance-exports.ts --out-dir ./_site",
    "cat-harness": '          bun run cat-harness/scripts/kg-export.ts             --out "./_site/${STUB}.jsonld"',
    "folio-assistant": '          bun run cat-harness/scripts/kg-export.ts --instance . --out "./_site/${ROOT_STUB}/${ROOT_STUB}.jsonld"',
    bootstrap: '          bun run bootstrap-tools/scripts/export-graph.ts --root ./bootstrap --base-url "x" --out y',
  };
  return Object.entries(lines)
    .filter(([k]) => !drop.includes(k))
    .map(([, v]) => v)
    .join("\n");
}

describe("the plan is the declarations, partitioned", () => {
  const plan = instanceExportPlan(REPO);
  const declared = declaredInstanceStubs(REPO);

  test("every declared instance is planned or published elsewhere, and never both", () => {
    const planned = new Set(plan.map((p) => p.stub));
    for (const s of declared) expect(planned.has(s) !== s in PUBLISHED_ELSEWHERE).toBe(true);
  });

  test("the instances this bean found unpublished are in it", () => {
    // Measured 2026-10-02 against gh-pages: declared, no document.
    const planned = plan.map((p) => p.stub);
    for (const s of ["smart-base", "who-iris", "folio-assistant-core", "fhir-harness"]) expect(planned).toContain(s);
  });

  test("an instance with its own canonical URL is marked so, and one without is not", () => {
    const by = new Map(plan.map((p) => [p.stub, p]));
    expect(by.get("smart-base")?.ownCanonical).toBe(true);
    expect(by.get("who-iris")?.ownCanonical).toBe(false);
  });
});

describe("a plan line expands to one invocation per planned instance", () => {
  const plan: PlannedExport[] = [
    { path: "./a", stub: "a", ownCanonical: false },
    { path: "./b", stub: "b", ownCanonical: true },
  ];
  test("without a base, nothing stands in", () => {
    const got = publishedInstances("bun run cat-harness/scripts/instance-exports.ts --out-dir ./_site", "w.yml", () => plan);
    expect(got.map((i) => [i.instance, i.standInBase])).toEqual([
      ["./a", false],
      ["./b", false],
    ]);
  });
  test("with a base, it stands in only where the publisher passes it", () => {
    const got = publishedInstances('instance-exports.ts --out-dir ./_site --base-url "$BASE"', "w.yml", () => plan);
    expect(got.map((i) => [i.instance, i.standInBase])).toEqual([
      ["./a", true],
      ["./b", false],
    ]);
  });
  test("a workflow with no plan line never asks for the plan", () => {
    let asked = false;
    publishedInstances("kg-export.ts --instance ./x --out x.jsonld", "w.yml", () => {
      asked = true;
      return plan;
    });
    expect(asked).toBe(false);
  });
});

describe("completeness — bean 4ak5 item 5", () => {
  const declared = new Set(Object.keys(PUBLISHED_ELSEWHERE));

  test("a deploy running every publisher is complete", () => {
    expect(incompleteExports(new Map([[DEPLOY_WORKFLOW, workflow()]]), declared)).toEqual([]);
  });

  test("a deploy without the plan line is incomplete — the state this bean found", () => {
    const got = incompleteExports(new Map([[DEPLOY_WORKFLOW, workflow(["plan"])]]), declared);
    expect(got.join("\n")).toContain("does not run `instance-exports.ts --out-dir`");
  });

  test("dropping an exempt instance's own publisher leaves it published by nobody", () => {
    for (const stub of Object.keys(PUBLISHED_ELSEWHERE)) {
      const got = incompleteExports(new Map([[DEPLOY_WORKFLOW, workflow([stub])]]), declared);
      expect(got).toHaveLength(1);
      expect(got[0]).toContain(`\`${stub}\` is exempt`);
    }
  });

  test("a publisher named only in a COMMENT is not a publisher", () => {
    const text = workflow(["bootstrap"]) + "\n          # bun run bootstrap-tools/scripts/export-graph.ts --root ./bootstrap --out y";
    expect(incompleteExports(new Map([[DEPLOY_WORKFLOW, text]]), declared).join("\n")).toContain("`bootstrap` is exempt");
  });

  test("an exemption naming no declared instance is a finding, not a pass", () => {
    const got = incompleteExports(new Map([[DEPLOY_WORKFLOW, workflow()]]), new Set(["cat-harness", "bootstrap"]));
    expect(got.join("\n")).toContain("`folio-assistant`, which no instance in this checkout declares");
  });

  test("the REAL workflows are complete", () => {
    const real = new Map([
      [DEPLOY_WORKFLOW, wf(DEPLOY_WORKFLOW)],
      ["feature-staging.yml", wf("feature-staging.yml")],
    ]);
    expect(incompleteExports(real, declaredInstanceStubs(REPO))).toEqual([]);
  });
});
