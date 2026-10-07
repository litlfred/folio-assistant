/**
 * `library-entry-iri` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/library-entry-iri.test.ts` (bean `7zz1`, owner
 * ruling 2026-10-06 "Top-level instance"): each reads the library entries of
 * smart-base, smart-trust and fhir-harness, which only the checkout holds.
 * Standing alone, cat-harness has none of it, and
 * `check:cat-harness-standalone` collects every test in that layer. The rest
 * of that file's tests stay there; every path here is composed from
 * ORIGIN_DIR, the directory they were written in, so nothing they read
 * changed.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { entryView, instanceRootRoutes } from "../cat-harness/scripts/gen-library-viz.ts";
import { LibraryIndexSchema } from "../cat-harness/schemas/site-indexes.ts";
import { siteDirFor } from "../cat-harness/schemas/cat-harness.ts";
import { libraryAssetIri, libraryAssetSitePath } from "../cat-harness/schemas/library-iri.ts";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

const HARNESS = resolve(ORIGIN_DIR, "../..");
const REPO = resolve(HARNESS, "..");
const SITE = join(HARNESS, siteDirFor(HARNESS));

describe("asset and rendering: two resources, two IRIs (owner, 2026-10-02)", () => {
  // "each asset should have one IRI, but the view page is a rendering of that
  // asset, a different page. fix IRIs" — and "asset doesnt know about its
  // renderings".
  const index = LibraryIndexSchema.parse(JSON.parse(readFileSync(join(SITE, "assets", "library", "index.json"), "utf-8")));
  test("every entry's @id IS the address of its published JSON-LD, and that file is published", () => {
    for (const e of index.entries) {
      const m = JSON.parse(readFileSync(join(REPO, e.dir, "manifest.jsonld"), "utf-8")) as { "@id": string };
      expect(m["@id"], e.dir).toBe(libraryAssetIri(e.instance, e.id));
      const published = join(SITE, libraryAssetSitePath(e.instance, e.id));
      expect(existsSync(published), published).toBe(true);
      expect((JSON.parse(readFileSync(published, "utf-8")) as { "@id": string })["@id"]).toBe(m["@id"]);
    }
  });
  test("entryView takes a link only when it is a DECLARED root, never any page", () => {
    const roots = new Map([["smart-trust", "/smart-trust/"]]);
    expect(entryView({ links: [{ href: "/smart-trust/" }] }, roots, "x/y/z")).toBe("/smart-trust/");
    expect(entryView({ links: [{ href: "/somewhere-else/" }] }, roots, "x/y/z")).toBe("/x/y/z/");
    expect(entryView({}, roots, "x/y/z")).toBe("/x/y/z/");
    expect(instanceRootRoutes(REPO).get("smart-trust")).toBe("/smart-trust/");
  });
});
