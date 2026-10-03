/**
 * The hits `check-fhir-harness-exclusions` found on 2026-10-03, when the gate
 * was turned on over a layer that was not yet clean. Owner ruling that day:
 * gate now, baseline these, clear them in a second stream. Each entry says why
 * it is here and which bean clears it. The baseline only shrinks: lower it
 * with `--shrink` after a fix, and never add an entry to admit a new hit —
 * move the WHO-specific part into smart-base instead.
 *
 * Keyed by file and rule with a COUNT, not a line, because line numbers move
 * on every unrelated edit.
 *
 * @module smart-base/scripts/fhir-harness-exclusions.baseline
 */
export interface BaselineEntry {
  file: string;
  rule: string;
  count: number;
  reason: string;
  bean: string;
}

export const BASELINE: readonly BaselineEntry[] = [
  {
    "file": "fhir-harness/processes/content/l3-fhir-pipeline.bpmn",
    "rule": "who-layer-path",
    "count": 1,
    "reason": "Documentary bpmn:import of smart-base's l2-dak-authoring.bpmn — the upward residual fhir-harness.json already records (proposal §5). Changing it needs the owner's OK.",
    "bean": "folio-assistant-veiu"
  },
  {
    "file": "fhir-harness/schemas/ig-identity.test.ts",
    "rule": "who-canonical",
    "count": 1,
    "reason": "Test fixture uses a WHO IG as sample data; swap for a non-WHO IG without weakening the assertion.",
    "bean": "folio-assistant-veiu"
  },
  {
    "file": "fhir-harness/schemas/ig-menu.test.ts",
    "rule": "dak-naming",
    "count": 2,
    "reason": "Test fixture uses a WHO IG as sample data; swap for a non-WHO IG without weakening the assertion. Includes a 'DAK API' menu entry.",
    "bean": "folio-assistant-veiu"
  },
  {
    "file": "fhir-harness/schemas/ig-menu.test.ts",
    "rule": "who-canonical",
    "count": 4,
    "reason": "Test fixture uses a WHO IG as sample data; swap for a non-WHO IG without weakening the assertion.",
    "bean": "folio-assistant-veiu"
  },
  {
    "file": "fhir-harness/scripts/gen-ig-pages.test.ts",
    "rule": "who-canonical",
    "count": 4,
    "reason": "Test fixture uses a WHO IG as sample data; swap for a non-WHO IG without weakening the assertion.",
    "bean": "folio-assistant-veiu"
  },
  {
    "file": "fhir-harness/scripts/ig-api-views.test.ts",
    "rule": "dak-naming",
    "count": 1,
    "reason": "Owner, 2026-10-03, on #1766: merge first and baseline, \"should be FHIR-IG-API, no DAK label/names\". Arrived with #1766 after its own rename (bean d313). A test title says 'DAK views'. Rename to 'IG API views'.",
    "bean": "folio-assistant-izx8"
  },
  {
    "file": "fhir-harness/scripts/ig-api-views.test.ts",
    "rule": "who-layer-path",
    "count": 2,
    "reason": "Owner, 2026-10-03, on #1766: merge first and baseline, \"should be FHIR-IG-API, no DAK label/names\". Arrived with #1766 after its own rename (bean d313). Two test strings use `smart-base/` as the separated-IG example path. Use a neutral fixture name.",
    "bean": "folio-assistant-izx8"
  },
  {
    "file": "fhir-harness/scripts/ig-api-views.ts",
    "rule": "dak-step",
    "count": 1,
    "reason": "Owner, 2026-10-03, on #1766: merge first and baseline, \"should be FHIR-IG-API, no DAK label/names\". Arrived with #1766 after its own rename (bean d313). A string cites `generate_dak_api_hub.py` as the WHO overlay source of the hub markers. Say 'the instance overlay' instead.",
    "bean": "folio-assistant-izx8"
  },
  {
    "file": "fhir-harness/scripts/ig-api-views.ts",
    "rule": "who-layer-path",
    "count": 1,
    "reason": "Owner, 2026-10-03, on #1766: merge first and baseline, \"should be FHIR-IG-API, no DAK label/names\". Arrived with #1766 after its own rename (bean d313). A string names the separated layout `smart-base/` (bean rbz3). Name the layout generically or pass it in.",
    "bean": "folio-assistant-izx8"
  },
  {
    "file": "fhir-harness/scripts/ig-binary-audit.test.ts",
    "rule": "who-canonical",
    "count": 1,
    "reason": "Owner, 2026-10-03, on #1766: merge first and baseline, \"should be FHIR-IG-API, no DAK label/names\". Arrived with #1766 after its own rename (bean d313). A fixture blob name carries `smart.who.int.base`. Use a non-WHO package id.",
    "bean": "folio-assistant-izx8"
  },
  {
    "file": "fhir-harness/scripts/ig-site-data.test.ts",
    "rule": "who-canonical",
    "count": 2,
    "reason": "Test fixture uses a WHO IG as sample data; swap for a non-WHO IG without weakening the assertion.",
    "bean": "folio-assistant-veiu"
  },
  {
    "file": "fhir-harness/tools/index.ts",
    "rule": "who-layer-path",
    "count": 1,
    "reason": "A Tool description string names a smart-base/ path. Reword it neutrally.",
    "bean": "folio-assistant-veiu"
  }
];
