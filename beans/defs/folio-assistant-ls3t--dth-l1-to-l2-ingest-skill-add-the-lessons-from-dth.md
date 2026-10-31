---
# folio-assistant-ls3t
$schema: bean/1.0.0
title: 'dth-l1-to-l2-ingest skill: add the lessons from dth-sc, dth-pc and dth-phc as rules'
status: in-progress
type: task
priority: normal
created_at: 2026-10-31T20:35:18Z
updated_at: 2026-10-31T20:50:00Z
parent: folio-assistant-dthl
---

Owner, 2026-10-31 (card "A. Both" on the PHC workplan thread): pass the section 9 proposals of litlfred/dth-phc#1 to their owners as beans. This one belongs with smart-base#249 (thread "Update DTH and review processes from recent work").

Add to the `dth-l1-to-l2-ingest` skill (smart-base `skills/`), as rules:

- [x] Link blocks through the glossary: a block's md shows a `**Concepts:**` line built from `meta.glossaryTerms`; only figure blocks link straight to ArchiMate views (core#407; dth-pc c747741, dth-phc 6adb102).
- [x] Validators and coverage checks live in folio-assistant-core, not in the DTH repo (core#377).
- [x] DMN house rules: complete tables, an explicit "unknown" outcome, explicit inputs on catch-alls, no rule narrower than the source, noun-phrase names, one source per table (dth-phc 02cb9f2).
- [x] Figures are rebuilt by type (ArchiMate, BPMN, class diagram, SVG from data; third-party and country figures stay cited images; the PNG is kept as evidence).
- [x] The first merge into a bare fork needs the owner's OK; then turn on Pages.
- [x] ArchiMate drafts: never edit a shipped draft (`0.3.0-draft.1`); write the next draft.
- [x] Read the workplan issue's comments first: agy may already have done steps.
- [x] New from the dth-phc#3 review: text shown as a verbatim quote must be found in the normalized L1 text by a check, not by eye (7 ch02 role quotes were not in the L1).
- [x] New: an agent never writes the owner's name into `signedOffBy` of `l1-exclusions.json`; an agent-written exclusion stays a proposal until the owner signs it.

Needs the owner's OK before any PR. Source: litlfred/dth-phc#1 section 8 (L1-L12) and section 9 item 1.

Owner OK 2026-10-31 20:48Z (option A). Added to smart-base#249 at 2153414; completes when #249 merges.
