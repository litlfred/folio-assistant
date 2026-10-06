/**
 * `contributions-root` tests whose subject is folio-assistant-sci's
 * contribution — the two cost checkers this instance contributes — moved here
 * from `cat-harness/content/pipeline/contributions-root.test.ts` (bean
 * `ho66`). The code under test is cat-harness's, imported DOWN; what it is
 * held against is this instance's, so standing alone cat-harness has nothing
 * for these to read. The rest of that file's tests stay there.
 */
import { describe, expect, test } from "bun:test";
import { contributionsRoot } from "../../../cat-harness/content/pipeline/repo-root";
import { loadContributions } from "../../../cat-harness/schemas/harness-config";
import { ContributionRegistry, type FolioContribution } from "../../../cat-harness/schemas/contributions";
const COST_CRITERIA = ["proof-compile-cost", "proof-no-cost-regression"];

async function checkersFrom(root: string) {
  const reg = await loadContributions<FolioContribution, ContributionRegistry>(root, new ContributionRegistry());
  return COST_CRITERIA.filter((c) => reg.qaChecker(c) !== undefined);
}

describe("contributionsRoot", () => {

  test("loading from contributionsRoot() registers both contributed cost checkers", async () => {
    expect(await checkersFrom(contributionsRoot())).toEqual(COST_CRITERIA);
  });
});
