/**
 * `kg-subscriptions` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/kg-subscriptions.test.ts` (bean `7zz1`, owner
 * ruling 2026-10-06 "Top-level instance"): each derives the staged instances
 * of the checkout, which only the checkout holds. Standing alone, cat-harness
 * has none of it, and `check:cat-harness-standalone` collects every test in
 * that layer. The rest of that file's tests stay there; every path here is
 * composed from ORIGIN_DIR, the directory they were written in, so nothing
 * they read changed.
 */
import { describe, expect, test } from "bun:test";

import { knownSubstrates } from "../cat-harness/scripts/subscriptions-viz.ts";
import { resolve, join } from "node:path";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

describe("the known-substrates registry (subscriptions-viz)", () => {
  const REPO = resolve(ORIGIN_DIR, "../../..");

  test("a staged instance is DERIVED as planned — nobody keeps a second list of it", () => {
    const rows = knownSubstrates(REPO);
    const core = rows.find((r) => r.name === "folio-assistant-core");
    expect(core?.status).toBe("planned");
    expect(core?.source).toBe("staged instance");
    expect(core?.repository).toBe("litlfred/folio-assistant-core");
  });
});
