/**
 * `referenced.json`: a library entry that RECORDS a source and holds none of
 * its text, written by `scripts/referenced-source.py`. Bean `scfh`, issue #1614.
 *
 * For a source whose licence forbids posting copies (the OMG BPMN and DMN
 * specifications). The entry identifies the exact bytes (`source.sha256`), its
 * clause outline so a citation can name a clause and a page, and why the text
 * is withheld. `materialization` is a `folio-materialization/v1` record in
 * state `referenced` — the vocabulary core's `materialization.ts` defines,
 * restated here only as far as this harness module may (harness does not
 * depend on core).
 *
 * @module schemas/referenced-source
 * @graphNode schema
 */
import { z } from "zod";

export const REFERENCED_SOURCE_SCHEMA_ID = "folio-referenced-source/v1" as const;

export const ReferencedSourceSchema = z
  .object({
    $schema: z.literal(REFERENCED_SOURCE_SCHEMA_ID),
    identity: z
      .object({
        title: z.string().min(1),
        version: z.string().min(1),
        document_number: z.string().min(1),
        date: z.string().min(1),
        publisher: z.string().min(1),
      })
      .strict(),
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
