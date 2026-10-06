/**
 * folio-assistant-sci's QA checkers and pipeline-plugin slots are KG nodes
 * (bean riit, step 3b), registered for a folio through its dependency tree.
 * Owner, 2026-10-04: every contribution is a node; one graph per type; a
 * folio sees the nodes of the instances it depends on.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import { ContributionRegistry } from "../../../cat-harness/schemas/contributions";
import { OwnCodeRefSchema, QaCheckerNodeSchema } from "../../../cat-harness/schemas/contribution-nodes";
import { loadContributionsSync } from "../../../cat-harness/schemas/harness-config";
import { COST_AUTOMATED_CHECKERS } from "./qa-checkers-cost";
import { PIPELINE_IMPLEMENTATIONS } from "./plugin-slots";

const REPO_ROOT = resolve(import.meta.dir, "..", "..", "..");
const withSci = loadContributionsSync(REPO_ROOT, new ContributionRegistry());
const withoutSci = loadContributionsSync(resolve(REPO_ROOT, "folio-assistant-core"), new ContributionRegistry());

describe("sci's contributions arrive as nodes, through the dependency tree", () => {
  test("every slot in the table is filled, with the table's own implementation", () => {
    for (const [slot, impl] of Object.entries(PIPELINE_IMPLEMENTATIONS)) {
      expect(withSci.pipelinePlugin(slot)).toBe(impl);
    }
  });

  test("every checker in the table is registered, hashed over the file that defines it", () => {
    for (const [criterion, check] of Object.entries(COST_AUTOMATED_CHECKERS)) {
      const entry = withSci.qaCheckerEntry(criterion);
      expect(entry?.check).toBe(check);
      expect(entry?.sourceFile).toBe("content/pipeline/qa-checkers-cost.ts");
    }
  });

  test("a folio whose tree does not include sci gets none of them", () => {
    for (const slot of Object.keys(PIPELINE_IMPLEMENTATIONS)) expect(withoutSci.pipelinePlugin(slot)).toBeUndefined();
    for (const criterion of Object.keys(COST_AUTOMATED_CHECKERS)) expect(withoutSci.qaCheckerEntry(criterion)).toBeUndefined();
  });
});

describe("a contribution's code ref is its own", () => {
  test("an instance prefix, an escaping path and a missing export are refused", () => {
    expect(OwnCodeRefSchema.safeParse("content/pipeline/x.ts#TABLE").success).toBe(true);
    expect(OwnCodeRefSchema.safeParse("cat-harness:content/pipeline/x.ts#TABLE").success).toBe(false);
    expect(OwnCodeRefSchema.safeParse("../cat-harness/x.ts#TABLE").success).toBe(false);
    expect(OwnCodeRefSchema.safeParse("content/pipeline/x.ts").success).toBe(false);
    expect(QaCheckerNodeSchema.safeParse({ $schema: "folio-qa-checker/v1", criterion: "c", check: "x.ts#T", extra: 1 }).success).toBe(false);
  });
});
