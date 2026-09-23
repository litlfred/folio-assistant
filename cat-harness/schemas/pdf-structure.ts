/**
 * `structure.json`: the structure of an ingested PDF, tagged `_schema: pdf-structure/v1`.
 *
 * Issue #1112. Two rungs write this file and, until now, nothing defined it:
 *
 * - `scripts/pdf-structure.py` writes the whole artefact: `source`, `metadata`,
 *   `toc`, `toc_source`, `sections` and `diagnostics`.
 * - `scripts/pdf-pages.py`, the no-outline rung, MERGES into whatever is there.
 *   It sets `granularity: "page"`, a top-level `text_source` and a
 *   `structure_note`, rewrites `sections` at page granularity, and adds `source`
 *   only when it is absent (`setdefault`, bean `nso8`).
 *
 * So the fields a page-granularity entry carries depend on whether
 * `pdf-structure` ran on it first. That is why `metadata`, `toc` and
 * `diagnostics` are optional here while `sections` and `source` are not.
 *
 * ## One section shape, strictly
 *
 * `pdf-pages.py` writes "EXACTLY the section shape `pdf-structure.py` writes,
 * field for field", because `gen-library-jsonld.ts` reads `sec.id`,
 * `page_start` and `page_end`, and an invented `section_id` crashed it once.
 * {@link PdfSectionSchema} is therefore `.strict()`. A second spelling of a
 * field is exactly the drift this schema exists to catch.
 *
 * ## Recorded, not fixed: the text origin has two spellings
 *
 * `source.text_source` (`pdf-structure.py`) is `"embedded" | "ocr"`. The top-level
 * `text_source` (`pdf-pages.py`) is `"text-layer" | "ocr"`. They answer one
 * question in two vocabularies. The schema accepts each where it is written
 * today, so no committed file changes. Unifying them is a producer change,
 * recorded in its own bean rather than folded in here.
 *
 * Measured 2026-09-23: all 22 committed `structure.json` files conform
 * (scripts/tests/pdf-structure-schema.test.ts).
 *
 * @module schemas/pdf-structure
 * @graphNode schema
 */
import { z } from "zod";

export const PDF_STRUCTURE_SCHEMA_ID = "pdf-structure/v1" as const;

/**
 * `toc_source`, FOUR states and not three (bean `6xaz`). `none` is a DETERMINED
 * "no discoverable table of contents"; `undetermined` is "one was inferred and
 * could not be trusted". `outline-unusable` is `pdf-pages.py`'s: the PDF has an
 * outline that this rung could not use.
 */
export const TOC_SOURCES = ["outline", "inferred", "undetermined", "none", "outline-unusable"] as const;

/**
 * One entry of the table of contents, as `pdf-structure.py`'s `TocEntry`.
 *
 * `page` is `null` when an OUTLINE entry has no destination. Measured: the first
 * entry of `who-iris/library/9789241548960-eng`, the document's own title node.
 * The outline says the entry exists and says nothing about where it is, and a
 * page number would be a guess.
 */
export const PdfTocEntrySchema = z
  .object({
    level: z.number().int().min(1),
    title: z.string(),
    page: z.number().int().min(1).nullable(),
    source: z.enum(["outline", "inferred"]),
    number: z.string().nullable(),
  })
  .strict();

/** One section. The single shape every consumer of `library/` reads. */
export const PdfSectionSchema = z
  .object({
    id: z.string().min(1),
    number: z.string().nullable(),
    title: z.string(),
    level: z.number().int().min(1),
    page_start: z.number().int().min(1),
    page_end: z.number().int().min(1),
    n_chars: z.number().int().min(0),
    n_words: z.number().int().min(0),
  })
  .strict()
  .refine((s) => s.page_end >= s.page_start, { message: "page_end is before page_start" });

const Sha256 = z.string().regex(/^[0-9a-f]{64}$/);

/**
 * The file the artefact was built from. `file`, `sha256`, `bytes`, `mtime` and
 * the SNIFFED mimetype are `_tech_meta.py`'s vocabulary (bean `nso8`). The
 * mimetype is `null` with `mimetype_source: "unrecognised"` when the leading
 * bytes are not recognised, and never guessed from the extension. `pages`,
 * `text_source` and `extractor` are written by `pdf-structure.py` only.
 */
export const PdfSourceSchema = z
  .object({
    file: z.string().min(1),
    sha256: Sha256,
    bytes: z.number().int().min(0),
    mtime: z.string().nullable(),
    mimetype_sniffed: z.string().nullable(),
    mimetype_source: z.enum(["magic-bytes", "unrecognised", "unreadable"]),
    pages: z.number().int().min(0).optional(),
    text_source: z.enum(["embedded", "ocr"]).optional(),
    extractor: z.enum(["pymupdf", "pypdf"]).optional(),
  })
  .strict();

/**
 * Front matter parsed from the first pages, plus the PDF's own docinfo. Its keys
 * follow what `parse_front_matter` found, so unknown keys pass through. `title`
 * is the one every consumer relies on.
 */
export const PdfMetadataSchema = z
  .object({
    title: z.string().nullable(),
    docinfo: z.record(z.string(), z.unknown()),
  })
  .passthrough();

export const PdfDiagnosticsSchema = z
  .object({
    pages_without_text: z.number().int().min(0),
    likely_scanned: z.boolean(),
    toc_entries: z.number().int().min(0),
    toc_inferred_entries: z.number().int().min(0).optional(),
    sections: z.number().int().min(0),
    chars_total: z.number().int().min(0),
  })
  .strict();

export const PdfStructureSchema = z
  .object({
    _schema: z.literal(PDF_STRUCTURE_SCHEMA_ID),
    doc_id: z.string().min(1),
    source: PdfSourceSchema,
    metadata: PdfMetadataSchema.optional(),
    toc: z.array(PdfTocEntrySchema).optional(),
    toc_source: z.enum(TOC_SOURCES),
    /** Why an inferred TOC was not trusted, in a sentence a person can check. */
    toc_undetermined_reason: z.string().nullable().optional(),
    sections: z.array(PdfSectionSchema),
    diagnostics: PdfDiagnosticsSchema.optional(),
    /** Written by `pdf-pages.py`: the entry was ingested one section per page. */
    granularity: z.literal("page").optional(),
    /** `pdf-pages.py`'s spelling of the text origin; see the module doc. */
    text_source: z.enum(["text-layer", "ocr"]).optional(),
    /** What a rung did NOT claim. Required by check-l1-complete when there are no sections. */
    structure_note: z.string().optional(),
  })
  .strict();

export type PdfStructure = z.infer<typeof PdfStructureSchema>;
