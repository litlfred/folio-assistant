/**
 * Bean `3ozg` — every workflow in this repository installs the same Bun.
 *
 * The corpus half of cat-harness's `scripts/tests/bun-pin.test.ts`: it runs
 * the gate (`cat-harness/scripts/check-bun-pin.ts`) over this index
 * repository's own `.bun-version` and `.github/workflows/`, so it lives here
 * (owner's ruling 2026-10-09, litlfred/folio-assistant#2521, ruling 1(c)).
 * The fixtures that show the gate can fail stay with the gate, in cat-harness.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import { bunPin } from "../../cat-harness/scripts/check-bun-pin.ts";

/** The index checkout's root — where `.bun-version` and `.github/workflows/` live. */
const INDEX = resolve(import.meta.dir, "..", "..");

describe("the real repository", () => {
  const report = bunPin(INDEX);

  test("`.bun-version` was READ — every assertion below is computed from it", () => {
    expect(report.expected).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("setup-bun sites were FOUND — a scan matching nothing must not read clean", () => {
    // The failure shape this repository keeps paying for. The gate exits 2 on
    // it rather than 0, and it is asserted here too because a test checking
    // only `findings` would pass over an empty scan.
    expect(report.sites).toBeGreaterThan(0);
    expect(report.workflows).toBeGreaterThan(0);
  });

  test("every site installs the pinned version", () => {
    expect(report.findings.map((f) => `${f.workflow} ${f.job} ${f.kind}`)).toEqual([]);
  });
});
