/**
 * The wrong-direction process bindings `check-process-bindings` found when it
 * was turned on, 2026-10-03. Each says why it is here and which bean clears
 * it. The baseline only shrinks: lower it with `--shrink` after a fix, and
 * never add an entry to admit a new binding.
 *
 * Keyed by file, activity id and ref, which are stable across unrelated edits.
 *
 * @module scripts/process-bindings.baseline
 */
export interface BindingBaselineEntry {
  file: string;
  node: string;
  ref: string;
  reason: string;
  bean: string;
}

export const BASELINE: readonly BindingBaselineEntry[] = [
  {
    "file": "cat-harness/processes/content/ig-ast-delta-review.bpmn",
    "node": "Task_Diff",
    "ref": "ig-ast-delta",
    "reason": "Generic IG process in cat-harness binds fhir-harness's ig-ast-delta (fhir-harness sits above cat-harness): move the process up to fhir-harness, or the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/content/ig-ast-delta-review.bpmn",
    "node": "Task_Review",
    "ref": "ig-ast-delta",
    "reason": "Generic IG process in cat-harness binds fhir-harness's ig-ast-delta (fhir-harness sits above cat-harness): move the process up to fhir-harness, or the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/content/ig-ast-delta-review.bpmn",
    "node": "Task_Validity",
    "ref": "ig-ast-delta",
    "reason": "Generic IG process in cat-harness binds fhir-harness's ig-ast-delta (fhir-harness sits above cat-harness): move the process up to fhir-harness, or the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/document-ingestion.bpmn",
    "node": "CallActivity_BuildKg",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/document-ingestion.bpmn",
    "node": "CallActivity_Derive",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/document-ingestion.bpmn",
    "node": "CallActivity_Extract",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/document-ingestion.bpmn",
    "node": "Task_Citeable",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/document-ingestion.bpmn",
    "node": "Task_Detect",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/document-ingestion.bpmn",
    "node": "Task_Licence",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/document-ingestion.bpmn",
    "node": "Task_Promote",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-build-l1-kg.bpmn",
    "node": "Task_Assets",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-build-l1-kg.bpmn",
    "node": "Task_Bind",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-build-l1-kg.bpmn",
    "node": "Task_Dublin",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-build-l1-kg.bpmn",
    "node": "Task_Link",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-build-l1-kg.bpmn",
    "node": "Task_Manifest",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-derive-content.bpmn",
    "node": "Task_Archive",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-derive-content.bpmn",
    "node": "Task_Audio",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-derive-content.bpmn",
    "node": "Task_Image",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-derive-content.bpmn",
    "node": "Task_Provenance",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-derive-content.bpmn",
    "node": "Task_Tabular",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-derive-content.bpmn",
    "node": "Task_TechMeta",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-extract-structure.bpmn",
    "node": "Task_Candidates",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-extract-structure.bpmn",
    "node": "Task_ExtractText",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-extract-structure.bpmn",
    "node": "Task_Ocr",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-extract-structure.bpmn",
    "node": "Task_Sections",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-extract-structure.bpmn",
    "node": "Task_Structure",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-l1-completeness-gate.bpmn",
    "node": "Task_CheckDerived",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-l1-completeness-gate.bpmn",
    "node": "Task_FlagDrift",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-l1-completeness-gate.bpmn",
    "node": "Task_RoundTrip",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "cat-harness/processes/library/ingest-l1-completeness-gate.bpmn",
    "node": "Task_Verdict",
    "ref": "document-intake",
    "reason": "cat-harness ingestion process binds folio-assistant-core's document-intake (core sits above cat-harness). library-ingestion says ingestion is a HARNESS capability, which argues for moving the skill down.",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "fhir-harness/processes/content/l3-fhir-pipeline.bpmn",
    "node": "Task_MapL2",
    "ref": "l2-dak-authoring",
    "reason": "Base FHIR pipeline binds smart-base's l2-dak-authoring. Owner 2026-10-03: this BPMN moves to smart-base (#1964).",
    "bean": "folio-assistant-veiu"
  },
  {
    "file": "folio-assistant-core/processes/content/content-change-review.bpmn",
    "node": "Task_DetectScope",
    "ref": "semantic-review-scoping",
    "reason": "folio-assistant-core process binds folio-assistant-sci's semantic-review-scoping (sci sits above core).",
    "bean": "folio-assistant-mlux"
  },
  {
    "file": "folio-assistant-core/processes/content/draft-to-publication.bpmn",
    "node": "Task_PublishRelease",
    "ref": "ig-publication",
    "reason": "folio-assistant-core process binds fhir-harness's ig-publication (fhir-harness sits above core).",
    "bean": "folio-assistant-mlux"
  }
];
