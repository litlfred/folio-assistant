/**
 * What makes a dataset findable — bean `p67i`.
 *
 * A CSV or spreadsheet in `uploads/` is stored but not findable: a grep for a
 * column header finds nothing, and that absence is indistinguishable from the
 * dataset not having that column. `tabular.jsonld` records sheet names,
 * headers and shape, so the header vocabulary joins the L1 source graph.
 *
 * ## The narrative is a state machine, and starts empty
 *
 * The bean also asks for "a narrative description of what the data is about".
 * That cannot be produced mechanically — it is somebody's account and it needs
 * an author. `narrative` is a {@link module:schemas/narrative} record, which
 * starts `not-authored` with no text, moves to `draft` when an agent writes
 * one, and reaches `confirmed` only when a HUMAN accepts it (bean `ju0u`).
 *
 * Generating a summary from the header names and shipping it as the answer
 * would be a claim nobody made, which is the failure the provenance arm exists
 * to prevent. Drafting one and saying so is not — that is what `draft` is.
 *
 * ## A null shape is not an empty sheet
 *
 * `rows`/`columns` are nullable and `shape_source` says which case it is. A
 * sheet whose `<dimension>` is absent or unparseable has an UNKNOWN shape, and
 * reporting `0 × 0` would say it is empty — a different fact, and one a reader
 * would act on.
 *
 * @module schemas/tabular-records
 * @graphNode schema
 */
import { z } from "zod";

import { CONTENT_CONTEXT_URL } from "./jsonld";

import { NarrativeSchema } from "./narrative";

/** Sniffed/declared types that route to the tabular rung. */
export const TABULAR_MIMETYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.spreadsheet",
] as const;

export const SHAPE_SOURCES = ["dimension", "counted", "undetermined"] as const;

export const TabularSheetSchema = z.object({
  name: z.string().min(1),
  /** Row 1, in column order. Empty when the sheet has no readable header row. */
  headers: z.array(z.string()),
  rows: z.number().int().nonnegative().nullable(),
  columns: z.number().int().positive().nullable(),
  shape_source: z.enum(SHAPE_SOURCES),
  delimiter: z.string().nullable().optional(),
  delimiter_source: z.enum(["sniffed", "undetermined"]).optional(),
});
export type TabularSheet = z.infer<typeof TabularSheetSchema>;

export const TABULAR_RECORDS_SCHEMA_ID = "folio-tabular-records/v1";

export const TabularRecordsSchema = z
  .object({
    /**
     * The published content context — bean `yh6u`. OPTIONAL because folio
     * repositories hold records written before the arm emitted it; when
     * present it must be that context, since any other would bind these keys
     * to terms nobody declared.
     */
    "@context": z.literal(CONTENT_CONTEXT_URL).optional(),
    $schema: z.literal(TABULAR_RECORDS_SCHEMA_ID),
    "@id": z.string().min(1),
    source: z.record(z.string(), z.unknown()),
    format: z.enum(["xlsx", "ods", "csv"]),
    sheets: z.array(TabularSheetSchema),
    n_sheets: z.number().int().nonnegative(),
    /** Every distinct header across every sheet — what a grep lands in. */
    header_vocabulary: z.array(z.string()),
    // Bean `ju0u`: one object with its own state machine, replacing the
    // `narrative: string|null` + `narrative_state` pair. Two loose fields
    // needed a cross-field refinement here to stop them contradicting each
    // other, and had nowhere to record WHO drafted or confirmed the text —
    // which is the whole substance of the owner's choice.
    narrative: NarrativeSchema,
  })
  .refine((d) => d.n_sheets === d.sheets.length, {
    message: "`n_sheets` disagrees with `sheets.length` — one of them is wrong",
    path: ["n_sheets"],
  })
  ;

export type TabularRecords = z.infer<typeof TabularRecordsSchema>;

export function isTabularMimetype(m: unknown): boolean {
  return typeof m === "string" && (TABULAR_MIMETYPES as readonly string[]).includes(m);
}
