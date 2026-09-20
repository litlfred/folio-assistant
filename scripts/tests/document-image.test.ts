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

import { buildDocumentNodes } from "../../content/pipeline/gen-library-jsonld.ts";
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

describe("figures reach the manifest as blocks", () => {
  // Bean `d5f1`. Measured against `wpr-rdo-2020-003-eng`, whose 21 figures sit
  // on pages 8, 9, 10, 26, 29, 30 and 31.
  /** A minimal StructureSection; only the page range matters to these tests. */
  const sec = (id: string, page: number) => ({
    id, number: null, title: id, level: 1,
    page_start: page, page_end: page, n_chars: 0, n_words: 0,
  });
  const structure = {
    doc_id: "d",
    sections: [
      sec("page-008", 8), sec("page-009", 9), sec("page-012", 12),
    ],
  };
  const sidecar = {
    $schema: "folio-document-images/v1" as const,
    doc_id: "d",
    images: [
      { id: "img-p008-1", file: "images/img-p008-1.png", role: "figure" as const,
        basis: { coverage: 0.005, imagesOnPage: 4, page: 8 },
        narrative: { text: null, state: "not-authored" as const } },
      { id: "img-p009-1", file: "images/img-p009-1.png", role: "figure" as const,
        basis: { coverage: 0.01, imagesOnPage: 1, page: 9 } },
      // A page scan on a page that HAS a section. Must not become a block.
      { id: "img-p012-1", file: "images/img-p012-1.png", role: "page-scan" as const,
        basis: { coverage: 0.998, imagesOnPage: 1, page: 12 } },
    ],
  };
  const build = (images?: typeof sidecar) =>
    buildDocumentNodes("d", structure, undefined, () => false, images);

  test("a figure becomes a block, typed as a figure in both vocabularies", () => {
    const f = build(sidecar).find((o) => o.path === "blocks/figure-img-p008-1.jsonld");
    expect(f).toBeDefined();
    const node = JSON.parse(f!.content);
    expect(node.kind).toBe("figure");
    expect(node["@type"]).toEqual(["folio:Figure", "doco:Figure"]);
    // Relative to the BLOCK, as prose's `text` already is.
    expect(node.file).toBe("../images/img-p008-1.png");
    expect(node.pageStart).toBe(8);
  });

  test("a PAGE SCAN never becomes a block, even on a page that has a section", () => {
    // The measurement, enforced at the last step: 140 of 164 placed images in
    // this corpus are scans, and a block for each would be 140 figure nodes
    // describing pages.
    const paths = build(sidecar).map((o) => o.path);
    expect(paths).not.toContain("blocks/figure-img-p012-1.jsonld");
    expect(paths.filter((p) => p.startsWith("blocks/figure-"))).toHaveLength(2);
  });

  test("the figure is contained by the section whose pages hold it", () => {
    const sec = build(sidecar).find((o) => o.path === "sections/page-008.jsonld");
    const node = JSON.parse(sec!.content);
    expect(node.contains).toContain("library/d/blocks/figure-img-p008-1");
    const other = JSON.parse(
      build(sidecar).find((o) => o.path === "sections/page-009.jsonld")!.content,
    );
    expect(other.contains).not.toContain("library/d/blocks/figure-img-p008-1");
  });

  test("narrative STATE travels, so absence is distinguishable from rejection", () => {
    const withN = JSON.parse(
      build(sidecar).find((o) => o.path === "blocks/figure-img-p008-1.jsonld")!.content,
    );
    expect(withN.narrative).toEqual({ text: null, state: "not-authored" });
    // And a figure carrying none says nothing rather than inventing a state.
    const without = JSON.parse(
      build(sidecar).find((o) => o.path === "blocks/figure-img-p009-1.jsonld")!.content,
    );
    expect(without.narrative).toBeUndefined();
  });

  test("no sidecar means no figure blocks — and no crash", () => {
    // `images.json` is absent for every document ingested before `d5f1`.
    expect(build(undefined).map((o) => o.path).filter((p) => p.includes("figure-"))).toEqual([]);
  });
});
