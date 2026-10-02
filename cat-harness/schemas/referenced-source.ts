/**
 * `referenced.json`: a library entry that RECORDS a source and holds none of
 * its text, written by `scripts/referenced-source.py`. Bean `scfh`, issue #1614.
 *
 * For a source whose licence forbids posting copies (the OMG BPMN and DMN
 * specifications). The entry identifies the exact bytes (`source.sha256`), its
 * clause outline so a citation can name a clause and a page, and why the text
 * is withheld. `materialization` is a `folio-materialization/v1` record in
 * state `referenced` — the vocabulary `materialization-state.ts` defines in
 * this instance since bean `tlat`; the rest of the record (gates, purpose) is
 * core's `materialization.ts`, restated here only as far as this harness module
 * may (harness does not depend on core).
 *
 * @module schemas/referenced-source
 * @graphNode schema
 */
import { z } from "zod";

export const REFERENCED_SOURCE_SCHEMA_ID = "folio-referenced-source/v1" as const;

/**
 * The identity fields a document may simply not print. A specification states
 * all four; a paper often states no version and no document number, and a
 * preprint may state no publisher or date at all. Such a field is `null` and is
 * NAMED in `not_stated` — so a null is a reading of the document, never an
 * omission. A field that is absent from the record is still refused.
 */
export const NULLABLE_IDENTITY_FIELDS = ["version", "document_number", "date", "publisher"] as const;

export const ReferencedIdentitySchema = z
  .object({
    title: z.string().min(1),
    version: z.string().min(1).nullable(),
    document_number: z.string().min(1).nullable(),
    date: z.string().min(1).nullable(),
    publisher: z.string().min(1).nullable(),
    /**
     * Bibliographic fields a paper carries and a specification usually does
     * not. Optional, and each is read off the document. `authors` is the key
     * `check-library-qa.ts` already reads.
     */
    authors: z.array(z.string().min(1)).min(1).optional(),
    venue: z.string().min(1).optional(),
    doi: z.string().regex(/^10\.\d{4,9}\/\S+$/).optional(),
    arxiv: z.string().regex(/^\d{4}\.\d{4,5}v\d+$/, "a VERSIONED arXiv id (archiving-arxiv)").optional(),
    /** Each nullable field the document does not state, and only those. */
    not_stated: z.array(z.enum(NULLABLE_IDENTITY_FIELDS)).optional(),
  })
  .strict()
  .superRefine((id, ctx) => {
    const listed = new Set(id.not_stated ?? []);
    for (const k of NULLABLE_IDENTITY_FIELDS) {
      if (id[k] === null && !listed.has(k))
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [k], message: `null but not named in not_stated` });
      if (id[k] !== null && listed.has(k))
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["not_stated"], message: `names ${k}, which has a value` });
    }
  });

export const ReferencedSourceSchema = z
  .object({
    $schema: z.literal(REFERENCED_SOURCE_SCHEMA_ID),
    identity: ReferencedIdentitySchema,
    source: z
      .object({
        file: z.string().min(1),
        sha256: z.string().regex(/^[0-9a-f]{64}$/),
        bytes: z.number().int().min(0),
        mtime: z.string().nullable(),
        mimetype_sniffed: z.string().nullable(),
        mimetype_source: z.string().min(1),
      })
      .strict(),
    outline: z.array(z.object({ level: z.number().int().min(1), title: z.string(), page: z.number().int().min(1).nullable() }).strict()),
    outline_source: z.enum(["embedded", "none"]),
    materialization: z
      .object({
        $schema: z.literal("folio-materialization/v1"),
        state: z.literal("referenced"),
        provenance: z.object({ upstream: z.object({ url: z.string().url() }).strict() }).strict(),
        note: z.string().min(1),
      })
      .strict(),
    withheld: z.object({ what: z.string().min(1), why: z.string().min(1) }).strict(),
  })
  .strict();
export type ReferencedSource = z.infer<typeof ReferencedSourceSchema>;
