/**
 * Qualified Dublin Core, as a graph node.
 *
 * @module schemas/dublin-core
 * @graphNode schema
 *
 * ## Why this is in cat-harness and not in `who-iris/`
 *
 * The owner, 2026-09-20: *"break up working bits (like .ts record for dublin
 * core) etc. fully worked for the three examples"*, and in the same breath
 * *"mionimal tools in who specific stuff."* Dublin Core is ISO 15836 and
 * DSpace is a repository platform; neither is WHO's. What IS WHO's is how IRIS
 * *uses* them — three identifier systems, MeSH as the subject vocabulary, a
 * legacy handle kept alive after a server merge — and that lives in the
 * `who-iris` instance's skill, beside the three records themselves.
 *
 * The line is the one {@link module:schemas/folio-graph-kind} already draws:
 * the layer that owns a vocabulary is the layer that can serve it to anybody.
 *
 * ## Qualified, repeatable, language-tagged — and all three are load-bearing
 *
 * This type is shaped by ONE measured record, not by a reading of the DC spec.
 * The full item record for `wpr-rdo-2020-003-eng`, extracted with `pdftotext`
 * on 2026-09-20, does all three of the things a naive model forbids:
 *
 *   - **Qualified.** Every field is `element.qualifier`: `dc.date.accessioned`,
 *     `dc.identifier.govdoc`, `dc.subject.mesh`, `dc.description.abstract`. A
 *     model keyed on the fifteen simple elements cannot address any of them.
 *   - **Repeated.** FOUR fields occur twice in that one record — two
 *     `dc.date.accessioned`, two `dc.date.available`, two `dc.identifier.uri`,
 *     two `dc.subject.mesh`. `Record<string, string>` silently keeps the last
 *     and drops the rest, and the ones it would drop are a real alternate
 *     identifier and half the subject indexing.
 *   - **Language-tagged.** The record carries a per-FIELD language column
 *     (`en` on `dc.description`, on `dc.title`, on each `dc.subject.mesh`, and
 *     conspicuously NOT on `dc.contributor.author` or the dates). The absence
 *     is data: an untagged value is not an English value, it is a value whose
 *     language nobody asserted.
 *
 * So the value type is a LIST of language-tagged values, always, even when the
 * list has one entry. A shape that is sometimes a string and sometimes an array
 * makes every consumer branch, and the consumer that forgets to branch is the
 * one that loses the second handle.
 *
 * ## What this type deliberately does NOT do
 *
 * It does not resolve, validate or deduplicate. `dc.identifier.uri` appearing
 * twice is not an error to be cleaned up — in the measured record the second is
 * `http://iris.wpro.who.int/handle/10665.1/14518`, a regional IRIS instance
 * that was merged into the global one, and dropping it would discard the only
 * evidence this repository holds of a source host disappearing. Judgement about
 * which identifier is authoritative belongs to the `iris-dspace` skill, which
 * can say WHY; a schema that deduplicated would make that judgement invisibly
 * and permanently.
 */
import { z } from "zod";

/** The `$schema` tag a record declares itself with. Extension is a coincidence; a declaration inside the file is the contract. */
export const DUBLIN_CORE_SCHEMA_TAG = "folio-dublin-core/v1";

/**
 * One value of one field.
 *
 * `language` is OPTIONAL and its absence means "nobody asserted one" — never
 * "English". The measured record leaves it off the dates and off
 * `dc.contributor.author` while setting it on `dc.title`, so the two states
 * genuinely occur side by side in a single item.
 */
export const DcValueSchema = z
  .object({
    value: z.string().min(1),
    /** BCP 47, as DSpace stores it (`en`, `en_US`, `fr`). */
    language: z.string().min(1).optional(),
    /**
     * The authority record this value is controlled by, where there is one.
     * `dc.subject.mesh` is a controlled vocabulary with its own resolution; a
     * free-text keyword is not. Keeping the distinction addressable is what
     * lets a later tool ask "which of these subjects can I look up".
     */
    authority: z.string().min(1).optional(),
  })
  .strict();
export type DcValue = z.infer<typeof DcValueSchema>;

/**
 * A qualified field name, split rather than stringly-typed.
 *
 * Split, because the two halves answer different questions and consumers ask
 * them separately: "give me every identifier" is `element === "identifier"`,
 * while "give me the government document number" is
 * `qualifier === "govdoc"`. On the flat string `dc.identifier.govdoc` the first
 * question becomes a prefix match, and a prefix match on `dc.date` also catches
 * `dc.dateAccepted` in instances that mint one.
 */
export const DcFieldSchema = z
  .object({
    /** The namespace prefix. `dc` throughout the measured record; DSpace also mints `dcterms`, `local` and others. */
    schema: z.string().min(1).default("dc"),
    element: z.string().min(1),
    qualifier: z.string().min(1).optional(),
    /** Every value, in the order the source gave them. Never collapsed. */
    values: z.array(DcValueSchema).min(1),
  })
  .strict();
export type DcField = z.infer<typeof DcFieldSchema>;

/** Render a field back to its `schema.element.qualifier` spelling. */
export function dcFieldName(f: Pick<DcField, "schema" | "element" | "qualifier">): string {
  return [f.schema, f.element, f.qualifier].filter(Boolean).join(".");
}

/**
 * A record, as one item's metadata.
 *
 * `fields` is an ARRAY and not a map keyed by field name, for the same reason
 * `values` is an array: the source has an order, the order is sometimes
 * meaningful (DSpace's `place` ordering on repeated fields), and a map keyed by
 * `dcFieldName` would make the two `dc.identifier.uri` entries collide at the
 * top level instead of the value level.
 */
export const DublinCoreRecordSchema = z
  .object({
    $schema: z.literal(DUBLIN_CORE_SCHEMA_TAG),
    /**
     * The repository's own identifier for the item — a DSpace UUID here. NOT
     * the library slug: the slug is derived downstream and is the weakest of
     * the three identifiers this repository holds for the one worked item.
     */
    id: z.string().min(1),
    fields: z.array(DcFieldSchema).min(1),
    /**
     * Where this record was read from, and when. A metadata record with no
     * provenance is the `source: null` defect bean `r1lz` was opened over,
     * wearing a different hat.
     */
    provenance: z
      .object({
        source: z.string().min(1),
        retrievedAt: z.string().min(1),
        method: z.string().min(1),
      })
      .strict(),
  })
  .strict();
export type DublinCoreRecord = z.infer<typeof DublinCoreRecordSchema>;

/** Every value of one qualified field, in source order. Empty when absent — which is not the same as a field present with no values, a state the schema forbids. */
export function dcValues(
  rec: DublinCoreRecord,
  element: string,
  qualifier?: string,
): DcValue[] {
  return rec.fields
    .filter((f) => f.element === element && f.qualifier === qualifier)
    .flatMap((f) => f.values);
}

/**
 * Every value across all qualifiers of one element.
 *
 * The question "what identifiers does this item have" spans `uri`, `govdoc`
 * and any other qualifier the instance mints, and a consumer that enumerated
 * the qualifiers it knew about would miss the one it did not.
 */
export function dcElement(rec: DublinCoreRecord, element: string): DcField[] {
  return rec.fields.filter((f) => f.element === element);
}
