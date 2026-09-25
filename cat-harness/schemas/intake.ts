/**
 * An intake record — what one capture put into `uploads/<doc>/`, and where it
 * came from. `folio-intake/v1`, rebuilt from schemas this repository already
 * has (#1168 B6b-2, bean `d4lb`).
 *
 * Owner, 2026-09-24: *"look to existing standards to restructure schema"*,
 * then *"reduce reuse recycle"*. So nothing here is new vocabulary:
 *
 * | part | reused from | not repeated here |
 * |---|---|---|
 * | what the item IS (title, identifiers, handle, type, subject) | the Dublin Core record, `folio-dublin-core/v1` | `title` only when nothing else describes it |
 * | the item itself, its materialization and gates | the catalogue node, `folio-catalogue-node/v1` | the intake points at it (`item`) |
 * | where the capture came from | `ProvenanceSchema` (`upstream` / `local`) | `system` / `instance`: the upstream URL's host says it |
 * | when and by whom | `capturedAt` as `folio-extraction/v1` means it — the capture moment | |
 * | each file's bytes | `ArchiveEntrySchema`'s `path` / `bytes` / `sha256` / `mimetype_sniffed` | |
 *
 * Until then there were TWO shapes under one filename: four hand-written IRIS
 * captures tagged `folio-intake/v1`, and the document adapter's untagged
 * `intake.json` whose `pipeline`, `chapters`, `blockCount` and `targetPaper`
 * were written once and never updated. The registry recorded
 * `writtenBy: scripts/library-graph.ts`, which only reads them.
 *
 * @graphNode schema
 * @module schemas/intake
 */
import { z } from "zod";

import { ProvenanceSchema } from "../../folio-assistant-core/schemas/materialization.js";
import { ArchiveEntrySchema } from "./archive-contents.js";

export const INTAKE_SCHEMA_TAG = "folio-intake/v1";

/**
 * ISO 8601 date-time, the offset optional. A capture tool that recorded local
 * time with no zone is kept unzoned: adding `Z` would assert UTC nobody knows.
 */
const DateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/, "an ISO 8601 date-time");

/** Where the capture came from, and when. */
export const IntakeSourceSchema = ProvenanceSchema.extend({
  /** The capture moment — not when this record was written. */
  capturedAt: DateTime,
  /** Who or what captured it. */
  capturedBy: z.string().min(1).optional(),
}).strict();

/** One file the capture delivered. */
export const IntakeFileSchema = ArchiveEntrySchema.pick({
  path: true,
  bytes: true,
  sha256: true,
  mimetype_sniffed: true,
})
  .extend({
    /** What the file is: `publication`, `full-item-record`, `item-page`, `upload`… */
    type: z.string().min(1),
    /** What it is FOR here: `original-bitstream`, `metadata-source`, `webpage-theme-source`, `none`. */
    role: z.string().min(1),
    note: z.string().min(1).optional(),
  })
  .strict();

export const IntakeSchema = z
  .object({
    $schema: z.literal(INTAKE_SCHEMA_TAG),
    /** The upload directory's name. */
    doc_id: z.string().min(1),
    /** The catalogue node this capture is of, by its `id` (`item/<uuid>`). */
    item: z.string().min(1).optional(),
    /** The Dublin Core record describing it, relative to this file. */
    record: z.string().min(1).optional(),
    /** A title — only for a capture nothing else describes. */
    title: z.string().min(1).optional(),
    /** Authored context for a person reading the file. */
    _comment: z.string().min(1).optional(),
    source: IntakeSourceSchema,
    files: z.array(IntakeFileSchema),
  })
  .strict()
  .refine((i) => i.item !== undefined || i.record !== undefined || i.title !== undefined, {
    message: "an intake names what it is a capture OF: a catalogue `item`, a Dublin Core `record`, or — only when neither exists — a `title`",
  });
export type Intake = z.infer<typeof IntakeSchema>;
