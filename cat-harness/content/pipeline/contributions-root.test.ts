/**
 * `contributionsRoot()` is where contributions load from, and the regression
 * it guards is measured, not hypothetical: qa-sweep loaded from
 * `cat-harness/`, which declares no dependencies, registered 0 contributed
 * checkers, and so never ran folio-assistant-sci's two cost criteria
 * (folio-assistant#1492). Loading from `cat-harness/` returns an empty
 * registry WITHOUT error, which is why this needs a test rather than a crash
 * to notice it.
 */

import { describe, expect, test } from "bun:test";
import { resolve } from "path";
import { contributionsRoot } from "./repo-root";
import { loadContributions } from "../../schemas/harness-config";
import { ContributionRegistry, type FolioContribution } from "../../schemas/contributions";

const PLATFORM_INSTANCE = resolve(import.meta.dir, "..", "..");
const COST_CRITERIA = ["proof-compile-cost", "proof-no-cost-regression"];

async function checkersFrom(root: string) {
  const reg = await loadContributions<FolioContribution, ContributionRegistry>(root, new ContributionRegistry());
  return COST_CRITERIA.filter((c) => reg.qaChecker(c) !== undefined);
}

describe("contributionsRoot", () => {
  test("in the platform's own repository it is the repository root, not cat-harness/", () => {
    expect(contributionsRoot()).toBe(resolve(PLATFORM_INSTANCE, ".."));
  });

  test("the control: loading from cat-harness/ registers neither cost checker", async () => {
    expect(await checkersFrom(PLATFORM_INSTANCE)).toEqual([]);
  });

  test("loading from contributionsRoot() registers both contributed cost checkers", async () => {
    expect(await checkersFrom(contributionsRoot())).toEqual(COST_CRITERIA);
  });
});
