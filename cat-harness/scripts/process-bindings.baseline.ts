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
    "file": "fhir-harness/processes/content/l3-fhir-pipeline.bpmn",
    "node": "Task_MapL2",
    "ref": "l2-dak-authoring",
    "reason": "Base FHIR pipeline binds smart-base's l2-dak-authoring. Owner 2026-10-03: this BPMN moves to smart-base (#1964).",
    "bean": "folio-assistant-veiu"
  }
];
