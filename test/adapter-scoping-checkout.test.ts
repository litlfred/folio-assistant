/**
 * `adapter-scoping` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/adapter-scoping.test.ts` (bean `7zz1`, owner
 * ruling 2026-10-06 "Top-level instance"): each reads the adapters and block
 * kinds the content instances contribute (smart-base's `dak`), which only the
 * checkout holds. Standing alone, cat-harness has none of it, and
 * `check:cat-harness-standalone` collects every test in that layer. The rest
 * of that file's tests stay there; every path here is composed from
 * ORIGIN_DIR, the directory they were written in, so nothing they read
 * changed.
 */
import { describe, test, expect } from "bun:test";
import { resolve, join } from "path";
import {
  PAPER_BLOCK_KINDS,
  CONTENT_ADAPTERS,
} from "../cat-harness/schemas/block-kinds";
import { incompatibleCompanions } from "../cat-harness/schemas/block-qa";
import { QA_CRITERIA_REGISTRY } from "../cat-harness/content/pipeline/qa-criteria-registry";
import { loadContributions } from "../cat-harness/schemas/harness-config";
import {
  ContributionRegistry,
  type FolioContribution,
} from "../cat-harness/schemas/contributions";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

/** The checkout's declared dependencies, as the sweep loads them. */
const REPO = resolve(ORIGIN_DIR, "../../..");
const registry = await loadContributions<FolioContribution, ContributionRegistry>(
  REPO,
  new ContributionRegistry(),
);
/** Every kind a dependency contributed, with the adapter it named. */
const contributed = registry.contributedKinds();

describe("adapter partition", () => {

  test("paper is the one built-in adapter — dak is contributed (bean 1335)", () => {
    expect([...CONTENT_ADAPTERS]).toEqual(["paper"]);
    expect(registry.contributedAdapters()).toContain("dak");
  });

  test("a contributed kind never overlaps a built-in one", () => {
    // `register` refuses the collision; this pins that the checkout's real
    // contributors honour it.
    const paper = new Set<string>(PAPER_BLOCK_KINDS);
    expect(contributed.length).toBeGreaterThan(0);
    for (const { kind } of contributed) expect(paper.has(kind)).toBe(false);
  });
});

describe("criterion adapter scope", () => {

  test("a criterion never depends on a companion its adapters cannot have", () => {
    // `depends_on` gates applicability, so a mismatched pair does not error —
    // it produces a criterion that is permanently `n/a` and looks registered.
    // A contributed adapter's roles come from the registry.
    for (const def of QA_CRITERIA_REGISTRY) {
      expect({ id: def.id, bad: incompatibleCompanions(def, registry) }).toEqual({
        id: def.id,
        bad: [],
      });
    }
  });
});
