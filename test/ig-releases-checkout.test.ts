/**
 * `ig-releases/v1` tests about the WHOLE CHECKOUT, moved here from
 * `fhir-harness/schemas/ig-releases.test.ts` (bean `7zz1`, owner ruling
 * 2026-10-06 "Top-level instance"): it reads smart-base's and smart-trust's
 * committed `releases.json`, and both instances sit ABOVE fhir-harness, so
 * standing alone fhir-harness has neither and the test failed its
 * `seed:ready --rehearse`. The schema's own tests stay there; every path here
 * is composed from ORIGIN_DIR, the directory it was written in, so nothing it
 * reads changed.
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import { IgReleasesSchema } from "../fhir-harness/schemas/ig-releases.ts";

/** The directory this test was written in (`fhir-harness/schemas/`). */
const ORIGIN_DIR = join(import.meta.dir, "../fhir-harness/schemas");

describe("ig-releases/v1 over this repository", () => {
  test("the committed records validate", async () => {
    for (const inst of ["smart-base", "smart-trust"]) {
      const f = Bun.file(`${ORIGIN_DIR}/../../${inst}/fhir-artifact-index/releases.json`);
      expect(IgReleasesSchema.safeParse(await f.json()).success).toBe(true);
    }
  });
});
