/**
 * One entry per DISTINCT image, and the placements the collapse must not lose.
 *
 * @module scripts/tests/image-placements.test
 * @graphNode none — a test
 *
 * Bean `j820`, issue #1234. Written because the migration that introduced
 * `placements[]` passed the whole 138-gate set UNTOUCHED — schema, generator,
 * 29 rewritten sidecars, 530 deleted PNGs, and not one red. A change that big
 * going green means nothing was looking, which is the `1xhc` shape. These are
 * the assertions that would have gone red.
 *
 * The corpus case at the end is the non-vacuous one: it reads the real
 * sidecars, so it fails if a future ingest re-introduces per-placement entries.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { DocumentImageSchema, ImagesSidecarSchema } from "../../schemas/document-image.ts";

const REPO = join(import.meta.dir, "../../..");

const geometry = (page: number) => ({
  method: "geometry" as const,
  coverage: 0.01,
  imagesOnPage: 3,
  page,
});

describe("placements — the array is optional and its first entry is `basis`", () => {
  test("a singly-placed image needs none", () => {
    const r = DocumentImageSchema.safeParse({
      id: "img-p001-1",
      file: "images/img-p001-1.png",
      role: "figure",
      basis: geometry(1),
    });
    expect(r.success).toBe(true);
  });

  test("placements[0] must be the placement `basis` describes", () => {
    // The drift this forbids is silent: `basis.page` and `placements` are two
    // spellings of where an image first appears, and a consumer reading one
    // would disagree with a consumer reading the other with nothing failing.
    const r = DocumentImageSchema.safeParse({
      id: "img-p003-6",
      file: "images/img-p003-6.png",
      role: "figure",
      basis: geometry(3),
      placements: [{ page: 7, coverage: 0.01, imagesOnPage: 3 }],
    });
    expect(r.success, "a placements[0] on another page must be refused").toBe(false);
  });

  test("the same image on several pages is accepted, first placement leading", () => {
    const r = DocumentImageSchema.safeParse({
      id: "img-p028-1",
      file: "images/img-p028-1.png",
      role: "figure",
      basis: geometry(28),
      narrative: { text: "The Principles for Digital Development logo.", state: "draft",
        drafted_by: { kind: "agent", id: "claude", model: "claude-opus-5" }, drafted_at: "2026-09-24" },
      placements: [
        { page: 28, coverage: 0.01, imagesOnPage: 3 },
        { page: 42, coverage: 0.01, imagesOnPage: 3, note: "header for this page's two principles" },
      ],
    });
    expect(r.success).toBe(true);
  });

  test("an empty placements array is refused — absent means singly placed", () => {
    const r = DocumentImageSchema.safeParse({
      id: "img-p001-1", file: "images/img-p001-1.png", role: "figure",
      basis: geometry(1), placements: [],
    });
    expect(r.success).toBe(false);
  });

  test("a note may not be empty — an unsaid thing is an absent field", () => {
    const r = DocumentImageSchema.safeParse({
      id: "img-p001-1", file: "images/img-p001-1.png", role: "figure",
      basis: geometry(1),
      placements: [{ page: 1, coverage: 0.01, imagesOnPage: 3, note: "" }],
    });
    expect(r.success).toBe(false);
  });
});

describe("the real corpus is deduplicated, and stays that way", () => {
  const entries = [
    // measured 2026-09-24; the left number is what the corpus held BEFORE
    { path: "cat-harness/library/arxiv-2312.07755v1", was: 84, now: 28 },
    { path: "smart-base/library/9789241509510-eng", was: 162, now: 103 },
    { path: "smart-base/library/9789241511766-eng", was: 99, now: 44 },
    { path: "smart-base/library/9789240010567-eng", was: 17, now: 11 },
  ];

  for (const e of entries) {
    test(`${e.path.split("/").pop()} holds ${e.now} distinct images, not ${e.was} placements`, () => {
      const s = ImagesSidecarSchema.parse(
        JSON.parse(readFileSync(join(REPO, e.path, "images.json"), "utf8")),
      );
      expect(s.images).not.toBeNull();
      expect(s.images!.length).toBe(e.now);
      const placements = s.images!.reduce((n, i) => n + (i.placements?.length ?? 1), 0);
      expect(placements, "every placement is still recorded").toBe(e.was);
    });
  }

  test("no two entries in one sidecar name the same file", () => {
    // What duplication looked like from inside: distinct ids, one image. This
    // is the property the collapse establishes, asserted directly rather than
    // through a count that a re-ingest could move.
    for (const e of entries) {
      const s = ImagesSidecarSchema.parse(
        JSON.parse(readFileSync(join(REPO, e.path, "images.json"), "utf8")),
      );
      const files = (s.images ?? []).map((i) => i.file);
      expect(new Set(files).size, e.path).toBe(files.length);
    }
  });

  test("the seven Principles logos are one image with six notes", () => {
    // The group that settled the design: byte-identical copies whose
    // descriptions share a clause about the IMAGE and differ about what each
    // copy serves. Collapsing without `note` would have dropped six of them.
    const s = ImagesSidecarSchema.parse(
      JSON.parse(readFileSync(join(REPO, "smart-base/library/9789240010567-eng/images.json"), "utf8")),
    );
    const logo = (s.images ?? []).find((i) => (i.placements?.length ?? 0) === 7);
    expect(logo, "the seven-placement entry").toBeDefined();
    expect(logo!.narrative?.text).toContain("Principles for Digital Development");
    const notes = logo!.placements!.filter((p) => p.note);
    expect(notes.length, "one per placement after the first").toBe(6);
    expect(notes.some((p) => p.note!.includes("Build for sustainability"))).toBe(true);
  });
});
