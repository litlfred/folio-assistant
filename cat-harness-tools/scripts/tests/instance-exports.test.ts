/**
 * One graph per declared instance — bean `4ak5` items 1 and 5.
 *
 * The workflow literals below are fixture text on purpose (bean `jijc`): a
 * matcher fed a constant it was built from asserts nothing.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { DEPLOY_WORKFLOW, incompleteExports, publishedInstances, unpublishedInstanceSchemas } from "../check-published-instance-exports.js";
import { publishedInstanceSchemas } from "../../../cat-harness/scripts/kg-export.js";
import { inAggregate } from "../../../cat-harness/test/support/checkout.js";
import {
  PUBLISHED_ELSEWHERE,
  declaredInstanceStubs,
  instanceExportPlan,
  publishesInstanceSchema,
  type PlannedExport,
} from "../../../cat-harness/scripts/instance-exports.js";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const wf = (n: string) => readFileSync(join(REPO, ".github", "workflows", n), "utf-8");

/** A workflow body that runs every publisher, minus whatever `drop` names. */
function workflow(drop: string[] = []): string {
  const lines: Record<string, string> = {
    plan: "          bun run cat-harness/scripts/instance-exports.ts --out-dir ./_site",
    "cat-harness": '          bun run cat-harness/scripts/kg-export.ts             --scope instance --out "./_site/${STUB}.jsonld"',
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
    // A plan row is the one whose document must link a schema index.
    expect(got.every((i) => i.planned === true)).toBe(true);
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

  test("the host publisher is accepted with the default scope and with `instance`, never `checkout`", () => {
    // Bean `4ak5` item 2: `checkout` would publish every stacked instance's
    // nodes under the host's name again — the state the split ended.
    const host = (flags: string): string[] =>
      incompleteExports(
        new Map([[DEPLOY_WORKFLOW, `${workflow(["cat-harness"])}\n          bun run cat-harness/scripts/kg-export.ts ${flags}--out "./_site/\${STUB}.jsonld"`]]),
        declared,
      );
    expect(host("")).toEqual([]);
    expect(host('--base-url "$BASE" --scope instance ')).toEqual([]);
    expect(host("--scope checkout ").join("\n")).toContain("`cat-harness` is exempt");
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

// ── The schema half — bean `4ak5` item 1 ───────────────────────────────────
//
// Reads other instances' real contracts and skills, so only where they are
// checked out together (standalone rule, bean `ho66`).
describe.skipIf(!inAggregate())("every contract a planned instance's skills name reaches its schema/", () => {
  const plan = instanceExportPlan(REPO);

  test("the deploy's own publisher leaves nothing out", () => {
    expect(unpublishedInstanceSchemas(plan)).toEqual([]);
  });

  test("the instances measured on 2026-10-05 with unpublished contracts now publish them", () => {
    const counts = new Map(plan.map((p) => [p.stub, publishedInstanceSchemas(resolve(REPO, p.path)).contracts.length]));
    for (const s of ["folio-assistant-core", "fhir-harness", "folio-assistant-sci", "smart-base"]) {
      expect(counts.get(s) ?? 0).toBeGreaterThan(0);
    }
  });

  test("FALSIFIED: a publisher that drops a contract fails the gate, naming it", () => {
    // The gate reads what the instance HAS from its skills' front matter and
    // what the publisher WRITES from the publisher, so a publisher that loses
    // a file is seen — the shape `folio-assistant-sci` would have had if the
    // contracts were read from its declared `schemas` graph (`sources/`).
    const dropping = (root: string) => {
      const built = publishedInstanceSchemas(root);
      return { ...built, contracts: built.contracts.slice(1), files: built.files.filter(([f]) => f !== built.contracts[0]?.published) };
    };
    const got = unpublishedInstanceSchemas(plan, dropping).join("\n");
    expect(got).toContain("which the publisher does not write into");
    expect(got).toContain("folio-assistant-sci");
  });

  test("FALSIFIED: a publisher that writes no index fails the gate", () => {
    const noIndex = (root: string) => {
      const built = publishedInstanceSchemas(root);
      return { ...built, files: built.files.slice(1) };
    };
    const got = unpublishedInstanceSchemas(plan.slice(0, 1), noIndex);
    expect(got).toHaveLength(1);
    expect(got[0]).toContain(`${plan[0]!.stub}.schema.json\` index`);
  });

  test("the document links an index exactly for the planned instances — the plan is the one answer", () => {
    for (const p of plan) expect(publishesInstanceSchema(resolve(REPO, p.path), REPO)).toBe(true);
    // The exempt instances keep their own publishers and get no schema/ from this one.
    expect(publishesInstanceSchema(REPO, REPO)).toBe(false); // the checkout root, `folio-assistant`
    expect(publishesInstanceSchema(join(REPO, "cat-harness"), REPO)).toBe(false);
    expect(publishesInstanceSchema(join(REPO, "bootstrap"), REPO)).toBe(false);
  });
});
