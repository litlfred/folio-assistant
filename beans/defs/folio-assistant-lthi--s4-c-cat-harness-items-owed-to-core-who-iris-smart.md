---
# folio-assistant-lthi
title: 'S4-c: cat-harness items owed to core, who-iris, smart-base, fhir-harness or the root (~45 rows)'
status: todo
type: task
priority: normal
created_at: 2026-10-01T12:16:24Z
updated_at: 2026-10-09T19:20:19Z
parent: folio-assistant-7x5n
---

Story S4 (rfuq). Rows: cat-harness/docs/proposals/placement-audit-2026-10-01.json (PR #1778) — instance=cat-harness, pr 'unplanned', target folio-assistant-core (SPLIT 14, MOVE 1), who-iris (SPLIT 8), smart-base (SPLIT 6, MOVE 6), fhir-harness (SPLIT 4), root (SPLIT 4); plus fhir-harness->smart-base SPLIT 7, core->sci SPLIT 3. SPLIT here mostly means keep the generic item and invert the upward reference.
## Done when
- [ ] every listed row resolved; gates green; merged


2026-10-09: blocker `hx65` is completed — removed (session https://claude.ai/code/session_01BJNRo4kh8U15HZVFDhYNJL). Note: 87 of 91 rows still at their original paths; re-derive against the post-split repos before working it.


## 2026-10-09: the smart-base / fhir-harness rows, re-measured post-split (session https://claude.ai/code/session_01BJNRo4kh8U15HZVFDhYNJL)
Re-derived from `placement-audit-2026-10-01.json` (`pr: unplanned`) against each repo's main.

**fhir-harness → smart-base, 7 rows: done.**
- litlfred/fhir-harness#15 (cc236ac) inverts six: ig-publication, l3-fhir-authoring, terminology-management, ig-build-pipeline, ig-publisher-fork and ig-render-jekyll. Each now has 0 upward ids or links.
- `skill-definitions/l3-fhir-authoring.json` was already 0, fixed by #1767.
- Nothing was lost: smart-base-tools already carried every removed paragraph.

**cat-harness → smart-base, 6 rows: 4 inverted, 2 left as mentions.**
- litlfred/cat-harness#73 (b764edd) and litlfred/smart-base#22 (cc1fc1a) invert four:
  - bpmn-authoring, dmn-authoring and translation-manager: the DAK notes moved to smart-base-tools.
  - harness-tiles.
- graph-detanglement (skill + BPMN) is reworded in past tense, because the example DID lift out.
- `instance-publication.md` is left as is: it uses smart-base and smart-trust as worked examples of identity and staging, which are mentions rather than dependencies.

**cat-harness → fhir-harness, 3 rows:**
- `ig-ast-delta-review.bpmn` is resolved; it now lives in fhir-harness.
- `before-after-preview.md`, pointing to fhir-validation and build-pdf: reader cross-refs, left.
- `requirements/fhir-validation.json` (rule 2, keep a generic stub): left.

**core → fhir-harness:** `quality-control.md` was not looked at.

**Not done:**
- The 6 GRADE code lists (cat-harness → smart-base MOVE). Moving them deletes them from cat-harness, so they wait on the owner.
- The other ~70 rows: core, sci, who-iris and root.

- core → fhir-harness `quality-control.md`: done, litlfred/folio-assistant-core#15 (2c137c5). The header and 'What to run' no longer name fhir-harness processes or skills, and the stale package name is fixed.
