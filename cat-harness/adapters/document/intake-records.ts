/**
 * The two records an upload writes: its intake and its Dublin Core record
 * (#1168 B6b-2, bean `d4lb`).
 *
 * Until then the upload handler wrote one untagged `intake.json` carrying
 * `classification`, `format`, and a `pipeline` / `chapters` / `blockCount` /
 * `targetPaper` block that was written once with its starting values and
 * never updated by anything. Now the description goes where descriptions
 * live — a `folio-dublin-core/v1` record beside the intake — and the intake is
 * `folio-intake/v1`, the same shape a hand-written capture has.
 *
 * | upload form field | Dublin Core |
 * |---|---|
 * | title | `dc.title` |
 * | type | `dc.type` |
 * | domain | `dc.subject` |
 * | normativeLevel | `dc.type.normativeLevel` — the owner's choice, 2026-09-24: qualified `dc.type`, since Dublin Core has no element for it |
 * | the detected format | `dc.format` |
 *
 * Both records are parsed by their schemas before they are returned, so the
 * adapter cannot write a file its own registry would reject.
 *
 * @module adapters/document/intake-records
 */
import { DUBLIN_CORE_SCHEMA_TAG, DublinCoreRecordSchema, type DublinCoreRecord } from "../../../folio-assistant-core/schemas/dublin-core.js";
import { INTAKE_SCHEMA_TAG, IntakeSchema, type Intake } from "../../schemas/intake.js";

export interface UploadDescription {
  docId: string;
  title: string;
  type: string;
  domain?: string;
  normativeLevel?: string;
  format?: string;
  /** The URL it was fetched from; absent for a file uploaded directly. */
  upstream?: string;
  /** ISO 8601 — when the bytes arrived. */
  capturedAt: string;
  files: { path: string; bytes: number; sha256: string }[];
}

/** The Dublin Core record's filename, beside the intake. */
export const recordFileName = (docId: string): string => `${docId}.dc.json`;

const METHOD = "folio-assistant document adapter: the upload form";

export function uploadRecords(u: UploadDescription): { intake: Intake; record: DublinCoreRecord } {
  const field = (element: string, value: string | undefined, qualifier?: string) =>
    value ? [{ schema: "dc", element, ...(qualifier ? { qualifier } : {}), values: [{ value }] }] : [];
  const record = DublinCoreRecordSchema.parse({
    $schema: DUBLIN_CORE_SCHEMA_TAG,
    id: u.docId,
    fields: [
      ...field("title", u.title),
      ...field("type", u.type),
      ...field("type", u.normativeLevel, "normativeLevel"),
      ...field("subject", u.domain),
      ...field("format", u.format),
    ],
    provenance: { source: u.upstream ?? "upload", retrievedAt: u.capturedAt, method: METHOD },
  });
  const intake = IntakeSchema.parse({
    $schema: INTAKE_SCHEMA_TAG,
    doc_id: u.docId,
    record: recordFileName(u.docId),
    source: { ...(u.upstream ? { upstream: u.upstream } : {}), capturedAt: u.capturedAt, capturedBy: METHOD },
    files: u.files.map((f) => ({ ...f, type: "upload", role: "original-bitstream" })),
  });
  return { intake, record };
}
