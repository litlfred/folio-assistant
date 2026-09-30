/**
 * `structure.json` as a BASE with VARIANTS — bean `rkqp`, owner 2026-09-30
 * ("A+B", after a measured analysis).
 *
 * @module schemas/document-structure
 *
 * ## Why a base, and why `pdf-structure/v1` is not renamed
 *
 * Measured before this was written: 17 readers take `structure.json`. Nine
 * read only fields every format has (a section's id, number, title, level and
 * sizes; the document's title). Three read `page_start` / `page_end` and
 * already treat them as optional. One (`check-l1-complete`) validates strictly
 * against the PDF schema. Four are PDF-only tools. So the base mostly WRITES
 * DOWN what the readers already assume, and nothing in the 43 committed PDF
 * files changes: `pdf-structure/v1` stays exactly as it is, as one variant.
 *
 * ## The one thing a variant must add: where a section IS
 *
 * A PDF section is located by pages; a notebook section by cells. The two are
 * not the same unit and must not be read as one, so {@link structureOf}
 * returns a `locator` that says which it is. A reader that wants pages asks
 * for `kind: "pages"` and gets nothing from a notebook, rather than a cell
 * index mistaken for a page number.
 *
 * ## Read it through the accessor
 *
 * {@link structureOf} is the one way to read a `structure.json` whose format
 * is not known in advance. A reader that parses the file itself learns one
 * variant and silently misreads the next, which is the drift this exists to
 * stop. A third format (HTML, DOCX) is a new variant here and no reader
 * changes.
 */
import { z } from "zod";

import { PDF_STRUCTURE_SCHEMA_ID, PdfStructureSchema, type PdfStructure } from "./pdf-structure.ts";

export const NOTEBOOK_STRUCTURE_SCHEMA_ID = "notebook-structure/v1" as const;

const Sha256 = z.string().regex(/^[0-9a-f]{64}$/);

/** One section of a notebook: a heading and the cells under it, up to the next heading of its level or above. */
export const NotebookSectionSchema = z
  .object({
    id: z.string().min(1),
    number: z.string().nullable(),
    title: z.string(),
    level: z.number().int().min(1),
    /** Zero-based index of the section's first cell, which is its heading cell. */
    cell_start: z.number().int().min(0),
    /** Zero-based index of its last cell, inclusive. */
    cell_end: z.number().int().min(0),
    /** How many of those cells are code. Kept verbatim in the section text, never executed. */
    code_cells: z.number().int().min(0),
    n_chars: z.number().int().min(0),
    n_words: z.number().int().min(0),
  })
  .strict()
  .refine((s) => s.cell_end >= s.cell_start, { message: "cell_end is before cell_start" });

export const NotebookSourceSchema = z
  .object({
    file: z.string().min(1),
    sha256: Sha256,
    bytes: z.number().int().min(0),
    mtime: z.string().nullable(),
    /**
     * The same two fields every rung writes (bean `nso8`), so the L1 gate's
     * `technical-metadata` requirement reads them as it does for a PDF. A
     * notebook has no magic bytes, so its type is decided by CONTENT, and
     * `mimetype_source` says exactly that rather than claiming a sniff.
     */
    mimetype_sniffed: z.literal("application/x-ipynb+json"),
    mimetype_source: z.literal("content"),
    /** A notebook is JSON; this is what the file declared (`nbformat`), not sniffed bytes. */
    nbformat: z.string().min(1),
    /** The kernel language the notebook declares, or null when it declares none. */
    language: z.string().nullable(),
    cells: z.number().int().min(0),
  })
  .strict();

export const NotebookStructureSchema = z
  .object({
    _schema: z.literal(NOTEBOOK_STRUCTURE_SCHEMA_ID),
    doc_id: z.string().min(1),
    source: NotebookSourceSchema,
    metadata: z.object({ title: z.string().nullable() }).passthrough(),
    /**
     * `headings`: sections come from markdown headings. `none`: the notebook
     * has no markdown heading, so it is one section, and `structure_note` says so.
     */
    toc_source: z.enum(["headings", "none"]),
    sections: z.array(NotebookSectionSchema),
    /** What the rung did NOT claim. Required when `toc_source` is `none`. */
    structure_note: z.string().optional(),
  })
  .strict()
  .refine((s) => s.toc_source !== "none" || (s.structure_note ?? "").trim() !== "", {
    message: "a notebook with no headings must say so in structure_note",
  });

export type NotebookStructure = z.infer<typeof NotebookStructureSchema>;

/** Every variant `structure.json` may be. Discriminated by its `_schema` tag. */
export const DocumentStructureSchema = z.union([PdfStructureSchema, NotebookStructureSchema]);
export type DocumentStructure = PdfStructure | NotebookStructure;

/** The `_schema` tags a `structure.json` may carry. */
export const DOCUMENT_STRUCTURE_SCHEMA_IDS = [PDF_STRUCTURE_SCHEMA_ID, NOTEBOOK_STRUCTURE_SCHEMA_ID] as const;

/** Where a section is, in the unit its format has. */
export type SectionLocator =
  | { kind: "pages"; start: number; end: number }
  | { kind: "cells"; start: number; end: number };

/** The fields every variant's sections share, plus where the section is. */
export interface BaseSection {
  id: string;
  number: string | null;
  title: string;
  level: number;
  n_chars: number;
  n_words: number;
  locator: SectionLocator;
}

/** A `structure.json` of any variant, read as the base. */
export interface BaseStructure {
  variant: "pdf" | "notebook";
  doc_id: string;
  title: string | null;
  sections: BaseSection[];
  /** The parsed variant, for the few readers that need its own fields. */
  raw: DocumentStructure;
}

/**
 * Read a parsed `structure.json` of either variant as the base.
 *
 * A reason rather than a throw when it is neither, because the readers here
 * report "could not read" as its own state. An unrecognised `_schema` is
 * named in the reason: a new format arriving is a finding, never a silent
 * empty section list.
 */
export function structureOf(json: unknown): BaseStructure | { reason: string } {
  const tag = typeof json === "object" && json !== null ? (json as { _schema?: unknown })._schema : undefined;
  if (tag === PDF_STRUCTURE_SCHEMA_ID) {
    const p = PdfStructureSchema.safeParse(json);
    if (!p.success) return { reason: `does not conform to ${PDF_STRUCTURE_SCHEMA_ID}: ${p.error.issues[0]?.message ?? "invalid"}` };
    return {
      variant: "pdf",
      doc_id: p.data.doc_id,
      title: p.data.metadata?.title ?? null,
      sections: p.data.sections.map((s) => ({
        id: s.id,
        number: s.number,
        title: s.title,
        level: s.level,
        n_chars: s.n_chars,
        n_words: s.n_words,
        locator: { kind: "pages", start: s.page_start, end: s.page_end },
      })),
      raw: p.data,
    };
  }
  if (tag === NOTEBOOK_STRUCTURE_SCHEMA_ID) {
    const n = NotebookStructureSchema.safeParse(json);
    if (!n.success) return { reason: `does not conform to ${NOTEBOOK_STRUCTURE_SCHEMA_ID}: ${n.error.issues[0]?.message ?? "invalid"}` };
    return {
      variant: "notebook",
      doc_id: n.data.doc_id,
      title: n.data.metadata.title,
      sections: n.data.sections.map((s) => ({
        id: s.id,
        number: s.number,
        title: s.title,
        level: s.level,
        n_chars: s.n_chars,
        n_words: s.n_words,
        locator: { kind: "cells", start: s.cell_start, end: s.cell_end },
      })),
      raw: n.data,
    };
  }
  return {
    reason:
      tag === undefined
        ? "carries no `_schema` tag, so its format cannot be known"
        : `carries \`_schema: ${JSON.stringify(tag)}\`, which is none of ${DOCUMENT_STRUCTURE_SCHEMA_IDS.join(", ")}`,
  };
}

/** The page range of a section, or undefined when its format has no pages. */
export function pagesOf(s: BaseSection): { start: number; end: number } | undefined {
  return s.locator.kind === "pages" ? { start: s.locator.start, end: s.locator.end } : undefined;
}
