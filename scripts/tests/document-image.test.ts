/**
 * The image schema, and its agreement with the extractor. Bean `d5f1`.
 *
 * The interesting tests here are the two refinements, because they encode the
 * measurement rather than a preference: a decided role must show its working,
 * and only a figure may carry a narrative. Of 164 placed images in this corpus
 * 140 are page scans, so a schema that let every image carry a description
 * would invite 140 narratives reading "a scanned page".
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  DESCRIBABLE_ROLES,
  DocumentImageSchema,
  IMAGE_ROLES,
  ImagesSidecarSchema,
  PAGE_COVERAGE_THRESHOLD,
  roleFor,
  withEmptyNarrative,
  type DocumentImage,
} from "../../schemas/document-image.ts";

const ROOT = resolve(import.meta.dir, "../..");

/** A decided figure entry; spread by the cases that vary one field. */
const FIGURE: DocumentImage = {
  id: "img-p007-1",
  file: "images/img-p007-1.png",
  role: "figure",
  basis: { coverage: 0.013, imagesOnPage: 3, page: 7 },
};

describe("what geometry implies", () => {
  test("a near-full-bleed image alone on its page is the page", () => {
    expect(roleFor({ coverage: 0.998, imagesOnPage: 1, page: 1 })).toBe("page-scan");
  });

  test("the half-page figure measured in 9789241548960_eng is a figure", () => {
    // 0.495, and the threshold is 0.80. The corpus has NOTHING between 0.50
    // and 0.99, which is why the line can sit where it does.
    expect(roleFor({ coverage: 0.495, imagesOnPage: 1, page: 12 })).toBe("figure");
  });

  test("a full-bleed image SHARING its page is not the page", () => {
    // Something else is on that page, so the image is not the page itself.
    expect(roleFor({ coverage: 0.998, imagesOnPage: 2, page: 3 })).toBe("figure");
  });

  test("the threshold is a boundary, not a vibe", () => {
    expect(roleFor({ coverage: PAGE_COVERAGE_THRESHOLD, imagesOnPage: 1, page: 1 })).toBe("page-scan");
    expect(roleFor({ coverage: PAGE_COVERAGE_THRESHOLD - 1e-9, imagesOnPage: 1, page: 1 })).toBe("figure");
  });

  test("no basis is UNDETERMINED, never a default role", () => {
    // The expensive direction: an image wrongly filed as `page-scan` is
    // dropped silently from every later description pass.
    expect(roleFor(undefined)).toBe("undetermined");
    expect(IMAGE_ROLES).toContain("undetermined");
  });
});

describe("a verdict must show its working", () => {
  test("a decided role with no basis is refused", () => {
    const { basis: _drop, ...noBasis } = FIGURE;
    const r = DocumentImageSchema.safeParse(noBasis);
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/basis|working/);
  });

  test("`undetermined` WITH a basis is also refused", () => {
    // Symmetric on purpose. A basis implies the geometry was read, and if it
    // was read the role is decidable — so the pair is incoherent.
    const r = DocumentImageSchema.safeParse({ ...FIGURE, role: "undetermined" });
    expect(r.success).toBe(false);
  });

  test("undetermined without a basis is fine", () => {
    const { basis: _drop, ...bare } = FIGURE;
    expect(DocumentImageSchema.safeParse({ ...bare, role: "undetermined" }).success).toBe(true);
  });
});

describe("only a figure is worth describing", () => {
  test("a page scan carrying a narrative is refused", () => {
    const r = DocumentImageSchema.safeParse({
      ...FIGURE,
      role: "page-scan",
      basis: { coverage: 0.998, imagesOnPage: 1, page: 4 },
      narrative: { text: null, state: "not-authored" },
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/scanned page/);
  });

  test("a figure carrying one is accepted", () => {
    const r = DocumentImageSchema.safeParse({
      ...FIGURE,
      narrative: { text: null, state: "not-authored" },
    });
    expect(r.success).toBe(true);
  });

  test("`withEmptyNarrative` gives a slot to figures and to nothing else", () => {
    expect(withEmptyNarrative(FIGURE).narrative?.state).toBe("not-authored");
    const scan: DocumentImage = {
      ...FIGURE, role: "page-scan", basis: { coverage: 0.998, imagesOnPage: 1, page: 4 },
    };
    expect(withEmptyNarrative(scan).narrative).toBeUndefined();
  });

  test("DESCRIBABLE_ROLES is derived, and excludes undetermined", () => {
    // Derived from IMAGE_ROLES rather than listed, so a role added to the
    // union cannot quietly become describable.
    expect(DESCRIBABLE_ROLES).toEqual(["figure"]);
    expect(DESCRIBABLE_ROLES).not.toContain("undetermined");
  });
});

describe("could-not-determine is not emptiness", () => {
  test("`images: null` must say why", () => {
    const r = ImagesSidecarSchema.safeParse({
      $schema: "folio-document-images/v1", doc_id: "x", images: null,
    });
    expect(r.success).toBe(false);
  });

  test("an empty array is a FINDING and needs no reason", () => {
    // "This document places no images" is a determined answer. Conflating it
    // with "could not look" is the failure this pair exists to prevent.
    expect(ImagesSidecarSchema.safeParse({
      $schema: "folio-document-images/v1", doc_id: "x", images: [],
    }).success).toBe(true);
  });

  test("a reason WITHOUT null is refused", () => {
    expect(ImagesSidecarSchema.safeParse({
      $schema: "folio-document-images/v1", doc_id: "x", images: [],
      undetermined_reason: "some reason",
    }).success).toBe(false);
  });
});

describe("the extractor's real output satisfies the schema", () => {
  // Fixtures prove the schema is self-consistent. Only real output proves the
  // Python writer and the TypeScript reader agree — which is the join that
  // silently broke twice already today, once in an outline regex and once in
  // a probe fixture.
  const pdf = join(ROOT, "uploads", "milnorlink.pdf");

  test("milnorlink's sidecar parses, and is 19 scans + 1 figure", () => {
    if (!existsSync(pdf)) {
      // Never a silent pass: say the arm did not run.
      console.log("  NOTE uploads/milnorlink.pdf absent — extractor arm did not run");
      return;
    }
    const r = Bun.spawnSync([
      "python3", join(ROOT, "scripts", "pdf-images.py"),
      "-o", join(ROOT, "library"), "--dry-run", "--json", pdf,
    ]);
    const out = new TextDecoder().decode(r.stdout).trim();

    // NO fallback-and-skip here. An earlier draft of this test quietly
    // returned when stdout held no JSON, which would have passed against a
    // broken extractor — the exact vacuity this suite keeps finding elsewhere.
    // If the backend is missing the sidecar still parses, as `images: null`
    // with a reason, and that is asserted rather than skipped.
    expect(r.exitCode === 0 || r.exitCode === 2).toBe(true);
    const parsed = ImagesSidecarSchema.safeParse(JSON.parse(out));
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const images = parsed.data.images;
    if (images === null) {
      // Could-not-determine is a legitimate result, and must say why.
      expect(parsed.data.undetermined_reason).toBeTruthy();
      console.log("  NOTE no PDF backend — asserted the undetermined shape instead");
      return;
    }
    expect(images.filter((i) => i.role === "page-scan")).toHaveLength(19);
    expect(images.filter((i) => i.role === "figure")).toHaveLength(1);
    // Every decided entry shows its working, on REAL output.
    for (const i of images) expect(i.basis !== undefined).toBe(i.role !== "undetermined");
  });
});
