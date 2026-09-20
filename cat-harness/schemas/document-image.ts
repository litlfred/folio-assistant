/**
 * @graphNode schema
 *
 * An image placed on a page of an ingested document — bean `d5f1`.
 *
 * ## Why a verdict is not enough
 *
 * The bean asks for a narrative description of every image. Measured on this
 * corpus 2026-09-20, that would be wrong six times out of seven: of 164 placed
 * images, **140 are page scans** — one near-full-bleed image per page, which is
 * the page itself, not a figure in it — against **24 candidate figures**.
 *
 * | document | pages | images | coverage | what they are |
 * |---|---|---|---|---|
 * | `WHO_PUB_TPS_93.1` | 121 | 121 | 0.998, one per page | page scans |
 * | `milnorlink` | 20 | 20 | 19 full-bleed | page scans |
 * | `9789241548960_eng` | 179 | 2 | ~0.50 | figures |
 * | `WPR-RDO-2020-003-eng` | 33 | 21 on 7 pages | median 0.013 | figures |
 *
 * So every entry carries a {@link ImageRole}. And it carries the **basis** for
 * that role, not only the role: `coverage` and `imagesOnPage` are the two
 * numbers the verdict was computed from, stored so the next reader can check
 * it rather than believe it.
 *
 * That is the `nso8` discipline, and this bean has already been burned by its
 * absence: `library/milnorlink/structure.json` carried a conclusion ("this PDF
 * carries no embedded outline") whose reason was false and unverifiable, and
 * it cost a full investigation under bean `8shg` before anyone could tell.
 *
 * ## The third state is `undetermined`, and it is not `scan`
 *
 * A role is only ever `page-scan` or `figure` when the geometry was actually
 * read. A backend that could not place an image yields `undetermined`, never a
 * default — an image wrongly filed as `page-scan` is silently dropped from
 * every description pass, which is the expensive direction to be wrong in.
 */
import { z } from "zod";

import { NarrativeSchema, NOT_AUTHORED, type Narrative } from "./narrative.ts";

/**
 * What an image IS, as distinct from what it depicts.
 *
 * - `page-scan` — the rendered page. Describing it produces "a scanned page".
 * - `figure` — something placed *within* a page. This is what `d5f1` is about.
 * - `undetermined` — the geometry could not be read. Never rendered as either.
 */
export const IMAGE_ROLES = ["page-scan", "figure", "undetermined"] as const;
export type ImageRole = (typeof IMAGE_ROLES)[number];

/** Roles a description is worth generating for. `undetermined` is not one. */
export const DESCRIBABLE_ROLES: readonly ImageRole[] = IMAGE_ROLES.filter(
  (r): r is ImageRole => r === "figure",
);

/**
 * Fraction of the page a placed image covers, at or above which it is the page
 * rather than a figure on it.
 *
 * 0.80 sits in an empty band: the corpus clusters at 0.998 (scans) and below
 * 0.50 (figures), with nothing between 0.50 and 0.99. Chosen low enough to
 * catch a scan with a margin, high enough that a half-page figure — measured
 * at 0.495 in `9789241548960_eng` — is never swept up.
 */
export const PAGE_COVERAGE_THRESHOLD = 0.8;

export const ImageBasisSchema = z.object({
  /** Placed area over page area. The number the role was computed from. */
  coverage: z.number().min(0),
  /** How many images share this page. A scan is alone on its page. */
  imagesOnPage: z.number().int().min(1),
  /** The page it sits on, 1-based as a reader counts. */
  page: z.number().int().min(1),
});
export type ImageBasis = z.infer<typeof ImageBasisSchema>;

export const DocumentImageSchema = z
  .object({
    /** Stable within the document: `img-p007-1`. */
    id: z.string().min(1),
    /** Path to the extracted file, relative to the library entry. */
    file: z.string().min(1),
    role: z.enum(IMAGE_ROLES),
    /** Why `role` says what it says. Absent only when nothing could be read. */
    basis: ImageBasisSchema.optional(),
    /** Present only where a description is worth having — see `role`. */
    narrative: NarrativeSchema.optional(),
  })
  // A role that was DECIDED must show its working; `undetermined` has none to
  // show. Without this a caller cannot tell a measured verdict from a default.
  .refine((i) => (i.role === "undetermined") === (i.basis === undefined), {
    message:
      "a decided role must carry its basis, and `undetermined` must not — " +
      "a verdict with no working is indistinguishable from a guess",
    path: ["basis"],
  })
  // The whole point of the measurement: no narrative slot on the 140 scans.
  .refine((i) => i.narrative === undefined || DESCRIBABLE_ROLES.includes(i.role), {
    message:
      "only a figure carries a narrative — a description of a page scan says " +
      "\"a scanned page\", 140 times over on this corpus",
    path: ["narrative"],
  });
export type DocumentImage = z.infer<typeof DocumentImageSchema>;

/** The sidecar `scripts/pdf-images.py` writes, one per library entry. */
export const ImagesSidecarSchema = z.object({
  $schema: z.literal("folio-document-images/v1"),
  doc_id: z.string().min(1),
  /**
   * Absent when the backend could not run. Distinct from `[]`, which is the
   * determined finding that this document places no images at all.
   */
  images: z.array(DocumentImageSchema).nullable(),
  /** Required whenever `images` is null: say why, never imply absence. */
  undetermined_reason: z.string().min(1).optional(),
})
  .refine((s) => (s.images === null) === (s.undetermined_reason !== undefined), {
    message:
      "`images: null` means COULD NOT DETERMINE and must say why; an empty " +
      "array is the determined finding that there are none",
    path: ["undetermined_reason"],
  });
export type ImagesSidecar = z.infer<typeof ImagesSidecarSchema>;

/**
 * The role implied by geometry. One definition, so the extractor and every
 * consumer cannot disagree about where the line is.
 */
export function roleFor(basis: ImageBasis | undefined): ImageRole {
  if (basis === undefined) return "undetermined";
  return basis.coverage >= PAGE_COVERAGE_THRESHOLD && basis.imagesOnPage === 1
    ? "page-scan"
    : "figure";
}

/** A fresh entry for a figure: describable, and not yet described. */
export function withEmptyNarrative(image: DocumentImage): DocumentImage {
  return DESCRIBABLE_ROLES.includes(image.role)
    ? { ...image, narrative: image.narrative ?? (NOT_AUTHORED as Narrative) }
    : image;
}
