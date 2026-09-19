/**
 * What makes a dataset findable — bean `p67i`.
 *
 * A CSV or spreadsheet in `uploads/` is stored but not findable: a grep for a
 * column header finds nothing, and that absence is indistinguishable from the
 * dataset not having that column. `tabular.jsonld` records sheet names,
 * headers and shape, so the header vocabulary joins the L1 source graph.
 *
 * ## The narrative is declared empty, never fabricated
 *
 * The bean also asks for "a narrative description of what the data is about".
 * That cannot be produced mechanically — it is somebody's account and it needs
 * an author. `narrative: null` with `narrative_state: "not-authored"` records
 * the slot as empty; when something fills it, it carries an `Attribution`
 * (bean `iqim`) naming the human, or the agent and its model.
 *
 * Generating a summary from the header names and stamping it as agent-written
 * would be a claim nobody made, which is the failure the provenance arm exists
 * to prevent.
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

/** Whether a narrative has been written, and by whom — never implied by absence. */
export const NARRATIVE_STATES = ["not-authored", "authored"] as const;

export const TabularRecordsSchema = z
  .object({
    $schema: z.literal(TABULAR_RECORDS_SCHEMA_ID),
    "@id": z.string().min(1),
    source: z.record(z.string(), z.unknown()),
    format: z.enum(["xlsx", "ods", "csv"]),
    sheets: z.array(TabularSheetSchema),
    n_sheets: z.number().int().nonnegative(),
    /** Every distinct header across every sheet — what a grep lands in. */
    header_vocabulary: z.array(z.string()),
    narrative: z.string().nullable(),
    narrative_state: z.enum(NARRATIVE_STATES),
  })
  .refine((d) => d.n_sheets === d.sheets.length, {
    message: "`n_sheets` disagrees with `sheets.length` — one of them is wrong",
    path: ["n_sheets"],
  })
  // The two halves of the narrative fact cannot contradict each other. A
  // `narrative_state: "authored"` with no text, or text filed as
  // "not-authored", is a record that says two things at once.
  .refine((d) => (d.narrative_state === "authored") === (d.narrative !== null), {
    message: "`narrative_state` disagrees with whether `narrative` is present",
    path: ["narrative_state"],
  });

export type TabularRecords = z.infer<typeof TabularRecordsSchema>;

export function isTabularMimetype(m: unknown): boolean {
  return typeof m === "string" && (TABULAR_MIMETYPES as readonly string[]).includes(m);
}
