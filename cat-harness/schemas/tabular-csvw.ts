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
 * So {@link SheetAnchorSchema} and friends are annotations on the CSVW
 * shape, carried in a record that is **plain JSON** — `tabular.csvw.json`,
 * not `.jsonld` — and {@link toCsvw} derives the genuine CSVW metadata
 * document from it. A CSVW reader is handed that, and only that.
 *
 * ## Why the record is JSON and not JSON-LD — bean `792y`
 *
 * It was named `tabular.csvw.jsonld` and claimed to BE a valid CSVW document
 * carrying `fac:` annotations a standard reader would ignore. Neither half was
 * true. It had no `@context`, so a CSVW parser rejects it outright and a
 * JSON-LD processor keeps only the `fac:` keys — read as IRIs in a URI scheme
 * called `fac`, the `zaqn` defect. And no spelling of the prefix can fix that
 * inside CSVW: its metadata documents may put only `@language` and `@base` in
 * a local context, so a prefix of ours can never be bound there.
 *
 * The owner chose, 2026-09-23, between that and full-IRI annotation terms: the
 * record is JSON, and the CSVW is DERIVED. Two reasons carried it. Nothing
 * reads these annotations as linked data — the graph projection
 * (`content/pipeline/tabular-nodes.ts`) reads `anchor.sheet` from the JSON —
 * and `directory-conventions` says to generate as many renderings as have a
 * consumer and no more. And JSON-LD DROPS `null`, while the three-state rule
 * below depends on a DETERMINED null: a CSV's sheet is `null` because a CSV
 * has none, which RDF could not tell from "never recorded".
 *
 * The `fac:` spelling of the keys is kept as a plain JSON name marking our
 * fields apart from CSVW's. In a JSON file it is a name, not a compact IRI —
 * which is the whole reason the extension had to change.
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
 * The record's filename. `.json`, deliberately — see "Why the record is JSON
 * and not JSON-LD" above. One constant, because the reader, the rung table
 * and the stub check each named it separately and a rename touched all three.
 */
export const TABULAR_CSVW_FILENAME = "tabular.csvw.json";

/** The context every CSVW metadata document carries (W3C CSVW Metadata §5.2). */
export const CSVW_CONTEXT = "http://www.w3.org/ns/csvw";

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
 * The keys {@link toCsvw} may emit — CSVW's own vocabulary and nothing else.
 *
 * Exported so the test can hold the export to it at EVERY level. A key outside
 * this set is either ours leaking into a document a standard reader parses, or
 * a CSVW term used here without being added to the list on purpose.
 */
export const CSVW_KEYS: ReadonlySet<string> = new Set([
  "@context",
  "tables",
  "url",
  "tableSchema",
  "columns",
  "name",
  "titles",
  "datatype",
]);

/**
 * One table, as CSVW: every annotation of ours dropped, at every level —
 * `datatypeSource` on a column included, which the helper this replaced
 * (`csvwOnly`) left in.
 */
export function csvwTable(table: z.infer<typeof CsvwTableSchema>): Record<string, unknown> {
  return {
    url: table.url,
    tableSchema: {
      columns: table.tableSchema.columns.map((c) => ({ name: c.name, titles: c.titles, datatype: c.datatype })),
    },
  };
}

/**
 * The CSVW metadata document for a record — a `TableGroup` with the CSVW
 * `@context`, which is what makes it CSVW at all, and no key of ours.
 *
 * What it cannot carry, by construction, is WHERE each table sits — the
 * annotations exist because CSVW has no vocabulary for that. A reader that
 * needs placement reads the JSON record; a reader that needs a standard table
 * description reads this. Neither is handed the other's document.
 */
export function toCsvw(doc: TabularCsvw): Record<string, unknown> {
  return { "@context": CSVW_CONTEXT, tables: doc.tables.map(csvwTable) };
}
