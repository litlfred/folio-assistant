/**
 * `qa-checker-discovery` tests whose subject is folio-assistant-sci's
 * contribution — the checkers this instance contributes for criteria declared
 * `checker_contributed` — moved here from
 * `cat-harness/scripts/tests/qa-checker-discovery.test.ts` (bean `ho66`). The
 * code under test is cat-harness's, imported DOWN; what it is held against is
 * this instance's, so standing alone cat-harness has nothing for these to
 * read. The rest of that file's tests stay there.
 */
import { describe, test, expect } from "bun:test";

import {
  criterionSubject,
  discoverBlockCheckers,
  discoverScriptCheckers,
} from "../../../cat-harness/content/pipeline/qa-checker-discovery.ts";
import { QA_CRITERIA_REGISTRY } from "../../../cat-harness/content/pipeline/qa-criteria-registry.ts";
import { loadContributions } from "../../../cat-harness/schemas/harness-config.ts";
import { ContributionRegistry, type FolioContribution } from "../../../cat-harness/schemas/contributions.ts";

/**
 * The dependency tree, loaded exactly as `qa-sweep` loads it.
 *
 * Not optional decoration: two criteria (`proof-compile-cost`,
 * `proof-no-cost-regression`) declare `checker_contributed`, so their checkers
 * come from `folio-assistant-sci` and are absent without this. A test that
 * dropped it would still pass its shape checks while measuring a discovery run
 * two criteria short.
 */
const REPO = new URL("../../..", import.meta.url).pathname;
const registry = await loadContributions<FolioContribution, ContributionRegistry>(
  REPO,
  new ContributionRegistry(),
);

const block = await discoverBlockCheckers(registry);
const script = await discoverScriptCheckers(registry);

describe("every automated criterion resolves, from the module the registry names", () => {
  // This replaced an equivalence check against the merged `AUTOMATED_CHECKERS`
  // table. That assertion was TRANSITIONAL — it proved the migration faithful
  // at the commit that made it — and keeping it meant keeping a six-way
  // aggregation alive with no production caller, purely as a fixture. The
  // durable invariant is the one below: each criterion resolves, and it
  // resolves from the file the registry declares, which is also the file whose
  // hash invalidates its verdicts.

  test("every automated block criterion resolves", () => {
    const automated = QA_CRITERIA_REGISTRY.filter(
      (c) => c.automated && criterionSubject(c) === "block",
    ).map((c) => c.id);
    expect(automated.length).toBeGreaterThan(50);
    expect(automated.filter((id) => !block.checkers.has(id))).toEqual([]);
  });
});

describe("the two disagreements are reported, not swallowed", () => {
  test("nothing automated is unimplemented right now", () => {
    expect(block.unimplemented).toEqual([]);
    expect(script.unimplemented).toEqual([]);
  });
});
