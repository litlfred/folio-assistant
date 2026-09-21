/**
 * @graphNode schema
 *
 * A tabular source as CSVW, annotated with what CSVW cannot say — bean `eief`.
 *
 * ## Why CSVW, and why annotated rather than replaced
 *
 * Bean `ulqj`, decided by the owner: *"not new/custom thing"*. This graph
 * BINDS eight published vocabularies — doco, deo, cito, oa, prov, skos,
 * dcterms, fhir — and zero folio inventions. `folio-tabular-records/v1` was
 * the exception, and CSVW is a W3C Recommendation that is already JSON-LD,
 * which the rest of this graph already is.
 *
 * **It said "already speaks" until 2026-09-21, and that was false** — bean
 * `fd6i`. Measured over the 1086 published `.jsonld` documents in this
 * repository, three of the eight are emitted (`dcterms` 1551, `prov` 952,
 * `cito` 2) and five are not. The decision the sentence records is untouched
 * by that: reusing a published vocabulary rather than inventing one is a
 * MODELLING choice, and it was made. What was not true was the claim about
 * what this instance emits.
 *
 * The gap is not a defect either, and that is the third state `fd6i` asked
 * for. This is the PLATFORM; the unemitted five describe what a FOLIO holds,
 * and this instance holds none. Each now carries a recorded reason naming
 * what would emit it, in `FORWARD_DECLARED` in
 * `scripts/check-context-emission.ts`, and `check:context-emission` fails on
 * any bound prefix that has neither an emission nor a reason. A forward
 * declaration is fine; a silent one is what this sentence used to be.
 *
 * It models table → column → datatype and **nothing else**: no formulas, no
 * merged cells, no styling. The owner's "no full Excel complexity" is
 * therefore a property of the vocabulary rather than a rule anyone has to
 * enforce.
 *
 * **What CSVW cannot express is WHERE a table is**, because in CSVW the table
 * IS the file. A real workbook breaks that three ways: tables that do not
 * start at A1, headers that are not row 1, and several tables on one sheet.
 * The owner asked for exactly this — *"location on sheet, row, col"*.
 *
 * So {@link SheetAnchorSchema} and friends are `fac:` annotations **on** a
 * valid CSVW document. A CSVW-only reader ignores them and still gets a
 * correct table description, which is the whole point of adopting a standard
 * and is asserted by a test rather than claimed here.
 *
 * ## "As best as can" is the three-state rule
 *
 * The owner's phrase. Every field is determined, or explicitly undetermined
 * WITH A REASON. Nothing defaults. A column that will not classify gets
 * `datatype: "any"` and `fac:datatypeSource: "undetermined"` — never a guess
 * that reads as a measurement, which is the failure this repository has paid
 * for repeatedly (bean `nso8`, and `6xaz` in a different format).
 *
 * ## No extractor ships with this
 *
 * The owner: *"no tooling needed, stub out, make QA to catch absence."* So the
 * tools are declared and STUBBED, and {@link TabularStubSchema} is what makes
 * a stub impossible to mistake for a result. A stub is never `met`; it is
 * `not-derivable` naming the tool that would fill it.
 */
import { z } from "zod";

/** How a value was arrived at. `undetermined` is a finding, never a default. */
export const DETERMINATION = ["measured", "declared", "undetermined"] as const;
export type Determination = (typeof DETERMINATION)[number];

/**
 * Where a table sits — the part CSVW has no vocabulary for.
 *
 * `sheet` is null for a CSV, which has exactly one table and no sheets. That
 * is a DETERMINED null rather than a missing field: a CSV genuinely has no
 * sheet name, and writing `"Sheet1"` would invent one.
 */
export const SheetAnchorSchema = z.object({
  sheet: z.string().min(1).nullable(),
  /** A1-style reference, when the format has one. */
  cell: z.string().regex(/^[A-Z]+[1-9]\d*$/).nullable(),
  row: z.number().int().positive(),
  column: z.number().int().positive(),
});
export type SheetAnchor = z.infer<typeof SheetAnchorSchema>;

/** Rows and columns the table occupies, or an honest unknown. */
export const ExtentSchema = z
  .object({
    rows: z.number().int().nonnegative().nullable(),
    columns: z.number().int().positive().nullable(),
    source: z.enum(DETERMINATION),
  })
  .refine(
    (e) =>
      e.source === "undetermined"
        ? e.rows === null && e.columns === null
        : e.rows !== null && e.columns !== null,
    {
      message:
        "`undetermined` means BOTH rows and columns are null, and a determined " +
        "extent must give BOTH — a half-known extent reads as a measurement",
      path: ["source"],
    },
  );
// The first version of that refine compared the two conditions for equality,
// which is true whenever both are false: `{rows: 8, columns: null, source:
// "measured"}` passed. Exactly the half-known extent the rule exists to
// refuse, and caught by the test written for it rather than by review.

/** One CSVW column, plus how confident we are about its datatype. */
export const CsvwColumnSchema = z.object({
  name: z.string().min(1),
  titles: z.string(),
  /** A CSVW datatype name. `any` is CSVW's own top type. */
  datatype: z.string().min(1),
  datatypeSource: z.enum(DETERMINATION),
}).refine((c) => c.datatypeSource !== "undetermined" || c.datatype === "any", {
  message: '`undetermined` datatype must be recorded as CSVW `any`, not guessed',
  path: ["datatype"],
});

/**
 * A tool that has not been built, recorded so its absence cannot read as a
 * result.
 *
 * `since` is required for the same reason a blocked bean needs one: an
 * undated stub cannot be told from abandoned work.
 */
export const TabularStubSchema = z.object({
  tool: z.string().min(1),
  reason: z.string().min(1),
  since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type TabularStub = z.infer<typeof TabularStubSchema>;

export const TABULAR_CSVW_SCHEMA_ID = "folio-tabular-csvw/v1";

/**
 * One table. CSVW keys are unprefixed as CSVW itself writes them; ours carry
 * `fac:` so the boundary is visible in the file, not only in this module.
 */
export const CsvwTableSchema = z
  .object({
    url: z.string().min(1),
    tableSchema: z.object({ columns: z.array(CsvwColumnSchema) }),
    "fac:anchor": SheetAnchorSchema.nullable(),
    "fac:headerRow": z.number().int().positive().nullable(),
    "fac:extent": ExtentSchema,
    /** Present iff no extractor produced this. */
    "fac:stub": TabularStubSchema.optional(),
  })
  .refine((t) => !t["fac:stub"] || t.tableSchema.columns.length === 0, {
    message:
      "a stubbed table must have NO columns. A half-stub is the worst state " +
      "there is: it reads as a working extraction that happens to be thin",
    path: ["fac:stub"],
  });

export const TabularCsvwSchema = z.object({
  $schema: z.literal(TABULAR_CSVW_SCHEMA_ID),
  doc_id: z.string().min(1),
  /** One per sheet. A CSV has exactly one; a workbook is a `csvw:TableGroup`. */
  tables: z.array(CsvwTableSchema),
});
export type TabularCsvw = z.infer<typeof TabularCsvwSchema>;

/** Is this record waiting on a tool nobody has written? */
export function stubsIn(doc: TabularCsvw): TabularStub[] {
  return doc.tables.flatMap((t) => (t["fac:stub"] ? [t["fac:stub"]] : []));
}

/**
 * The document a CSVW-only reader sees: ours stripped out.
 *
 * Exported so the "a standard reader still parses this" claim is exercised
 * rather than asserted — the single property that justifies annotating a
 * standard instead of inventing a schema.
 */
export function csvwOnly(table: z.infer<typeof CsvwTableSchema>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(table).filter(([k]) => !k.startsWith("fac:")),
  );
}
