---
# folio-assistant-pha7
title: 'TOOL 5/13: Task_ExtractPOT/InjectPO/RoundTripQA — translation (24 files, 5 entry points)'
status: todo
type: task
priority: normal
created_at: 2026-09-20T04:34:35Z
updated_at: 2026-09-20T04:34:35Z
parent: folio-assistant-d308
---

Group 5 of 13 in `d308`. **24 files, 5 entry points.**

`pot-extract`, `po-inject`, `po-resolve`, `translation-index`,
`translation-block-qa`, `translation-qa-sweep`, `translation-roundtrip`,
`bpmn-translate`, `translate-bpmn`, `translate-kg-viewer`, `check-l1-complete`, and
`scripts/translation/` (13 files).

**BPMN:** `human-translation-workflow · Task_ExtractPOT · Task_InjectPO ·
Task_RoundTripQA` — three `serviceTask`s, so this is a strong candidate for three
Tool nodes rather than one. Also `ingest-l1-completeness-gate · Task_RoundTrip`.

**Target repo (#223):** `folio-assist-core`.

**Known live defect in this group, already paid for once:** `po-resolve.ts`
declared the translations directory a second time, which turned
`translation:block-qa:check` red in CI on 2026-09-19 and was fixed by REMOVING the
duplicate declaration rather than adding a third. A Tool node here should name the
declared directory, never compose the path.

## Done when
- [ ] Tool node(s) — likely three, one per serviceTask
- [ ] `satisfies` names the translation skills the diagram refs
- [ ] the declared `translation-sources` directory read, never composed
- [ ] `tool-coverage` reflects it
