/**
 * `stage-ig-sites` tests about the WHOLE CHECKOUT, moved here from
 * `fhir-harness/scripts/build-ig-site.test.ts` (bean `7zz1`, owner ruling
 * 2026-10-06 "Top-level instance"): each reads the real smart-trust,
 * smart-base and who-iris declarations, all ABOVE fhir-harness, so standing
 * alone fhir-harness has none of them and both failed its
 * `seed:ready --rehearse`. That file keeps the same two properties over
 * synthetic instances; every path here is composed from ORIGIN_DIR, the
 * directory these were written in, so nothing they read changed.
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import { igSiteDocs, webpagePalette } from "../fhir-harness/scripts/stage-ig-sites.ts";

/** The directory these tests were written in (`fhir-harness/scripts/`). */
const ORIGIN_DIR = join(import.meta.dir, "../fhir-harness/scripts");

describe("igSiteDocs over this repository", () => {
  test("only an instance that DECLARES igSite builds its IG site at its root", () => {
    expect(igSiteDocs(join(ORIGIN_DIR, "..", "..", "smart-trust"))).toBe(join(ORIGIN_DIR, "..", "..", "smart-trust", "docs/"));
    // Every smart-* IG with a menu does, the same way (owner: "no drift issues").
    expect(igSiteDocs(join(ORIGIN_DIR, "..", "..", "smart-base"))).toBe(join(ORIGIN_DIR, "..", "..", "smart-base", "docs/"));
    // An instance that holds no IG does not.
    expect(igSiteDocs(join(ORIGIN_DIR, "..", "..", "who-iris"))).toBeUndefined();
  });
});

describe("webpagePalette inherits along needs (bean `mftp`), over this repository", () => {
  test("smart-trust declares no theme and wears smart-base's, found through smart-ig", () => {
    const root = join(ORIGIN_DIR, "..", "..");
    const t = webpagePalette(root, "smart-trust");
    expect(t.palette).toBeDefined();
    expect(t.note).toContain("inherited from smart-base");
    expect(webpagePalette(root, "smart-base").note).not.toContain("inherited");
  });
});
