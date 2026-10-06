/**
 * `gen-lsi-viz` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/gen-lsi-viz.test.ts` (bean `7zz1`, owner ruling
 * 2026-10-06 "Top-level instance"): each reads the LSI indexes every instance
 * in the checkout publishes, which only the checkout holds. Standing alone,
 * cat-harness has none of it, and `check:cat-harness-standalone` collects
 * every test in that layer. The rest of that file's tests stay there; every
 * path here is composed from ORIGIN_DIR, the directory they were written in,
 * so nothing they read changed.
 */
import { describe, expect, test } from "bun:test";
import { renderCommitted } from "../cat-harness/scripts/gen-lsi-viz.ts";
import { type LsiSidecar } from "../cat-harness/scripts/lsi.ts";

/** Two real skill files, so "every unit it names is a file" has something true to check. */
const UNIT_A = "cat-harness/skills/sdlc/sdlc-core/qa-reports.md";
const UNIT_B = "cat-harness/skills/sdlc/sdlc-core/qa-witness.md";

const FIXTURE: LsiSidecar = {
  $schema: "folio-lsi-index/v1",
  method: "cat-harness/methodologies/lsi.md",
  instance: "fixture-instance",
  graph: "fixture-graph",
  path: "cat-harness/skills",
  docs: null,
  fingerprint: "0".repeat(64),
  options: { k: 2, weighting: "log-entropy", minDf: 2, maxDfShare: 0.5, powerIterations: 4, seed: 1990 },
  units: 2,
  terms: 3,
  k: 2,
  retained: 0.5,
  dimensions: [
    { dim: 1, sigma: 2.5, positive: ["qa", "branch"], negative: [] },
    { dim: 2, sigma: 1.25, positive: ["witness"], negative: ["store|pipe"] },
  ],
  findings: {
    nearDuplicates: [{ a: UNIT_A, b: UNIT_B, cosine: 0.97 }],
    narrowDimensions: [{ dim: 2, units: [UNIT_B] }],
  },
  neighbours: {},
};

describe("the LSI viewer page", () => {
  // `renderCommitted` walks every declared prose graph (~2-4 s on a CI
  // runner), so it is rendered ONCE here and reused; only the determinism
  // test below renders it a second time, and carries a timeout for that.
  let committedOnce: string | undefined;
  const committedPage = (): string => (committedOnce ??= renderCommitted());

  // Bean `tqjj`. The "committed indexes" and "units indexed" tiles are GONE:
  // both moved whenever any file was added to any indexed graph, which is the
  // `y7b3` class and cost 319 of the last 400 commits on `main`. What is
  // asserted instead is the property that replaced them — the committed page
  // is a function of the TREE, so it reads the same with and without an index
  // to hand, and only `--detail` adds anything that an index's content moves.
  test("the committed page carries no value an index's content moves", () => {
    const committed = committedPage();
    for (const n of [FIXTURE.units, FIXTURE.terms].map(String)) {
      expect(committed).not.toContain("<b>" + n + "</b>");
    }
    expect(committed).not.toContain("committed indexes");
    expect(committed).not.toContain("units indexed");
    expect(committed).not.toContain("## " + FIXTURE.instance + " / " + FIXTURE.graph);
    expect(committed).not.toContain(FIXTURE.fingerprint);
  }, 30_000);
});
