---
# folio-assistant-sopq
title: Mine the WHO IG starter kit SOPs for DAK QA criteria
status: todo
type: task
priority: normal
created_at: 2026-08-26T19:15:00Z
updated_at: 2026-08-26T19:15:00Z
---

Split out of `p2en`, whose original question — what schema consolidates math and
health-policy ingestion — is answered. This is the follow-on it uncovered.

## Why

`p2en` landed DAK block kinds, adapter-scoped QA axes, and five DAK checkers,
but those criteria were written from what the corpus happens to contain. WHO
publishes its own authoring standards, and they are the better source: a
criterion derived from `checklist.md` is one a DAK author is already being held
to, rather than one this platform invented.

Repo: <https://github.com/WorldHealthOrganization/smart-ig-starter-kit>
(cloned at `/home/user/litlfred/smart-ig-starter-kit` during `p2en`).

## Unread

~3,900 of the kit's ~4,300 SOP lines. Only `l2_dak_authoring.md` (421) was read.

Highest-value first, by apparent fit to existing QA machinery:

- `checklist.md` (297) — reads as WHO's own pre-publication gate. Closest thing
  to a ready-made criterion list.
- `qa_check.md` (28) — short; likely names the mechanical checks WHO runs.
- `authoring_conventions.md` (78) — naming/structure rules, the kind a
  mechanical axis can enforce.
- `l3_*.md` (~12 files) — per-artefact-type L3 authoring rules
  (`l3_requirements`, `l3_testing`, `l3_indicators`, `l3_logicalmodels`,
  `l3_valuesets`, `l3_personas`, `l3_forms`, `l3_processes`,
  `l3_structuremaps`, `l3_scenarios`, `l3_examples`, `l3_libraries`).
- `l2_l3_overview.md` (247), `l2_templates.md` (99), `semanticreferences.md`,
  `structure.md`, `l4_compliance.md`.

## Two findings already in hand that belong here

1. **An unenforceable constraint WHO ships.** Every `*Source` in
   `DAKComponentSources.fsh` says in prose "**exactly one of** url | canonical |
   instance must be provided", and there is **not one `Invariant:`/`obeys` in
   any of WHO's 17 logical models** (grepped). A DAK supplying all three, or
   none, validates clean against the FHIR toolchain. This is a QA criterion this
   platform can carry and that toolchain structurally cannot — a strong
   candidate for the first SOP-derived axis.

2. **The official component templates are `.xlsx`, and we have them.**
   `input/images/` ships `DAK_core data dictionary_template_v2.1.xlsx`,
   `DAK_decision-support logic_template_v2.1.xlsx`, `DAK_scheduling logic…`,
   `DAK_indicators and performance metrics…`, `DAK_high-level functional and
   non-functional requirements…` (v2 and v2.1). These define the canonical sheet
   structure for exactly the kinds `WORKBOOK_BACKED_KINDS` exempts from a
   required companion. A workbook reader is now bounded against a published
   template rather than reverse-engineered from one repository — which also
   unblocks the `.xlsx` rendering deferred since §12.18.

## Also still open from `p2en`

- Compare `sgex`'s `bpmn-to-svg.js` (jsdom) against `scripts/bpmn-render.ts`
  (Chromium) on the same 8 WHO processes. Low priority: the Chromium route
  works (8/8, 0 failures), so this is a "is there a lighter dependency" question,
  not a gap.

## Not in scope

Authoring folio content. This repo is the platform; anything WHO-domain that
turns out to be subject matter belongs in a DAK repo as data, per AGENTS.md.
