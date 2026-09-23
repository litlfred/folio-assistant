---
# folio-assistant-h97v
title: 'METHODOLOGY EVIDENCE: SWOT adopted end-to-end, and every methodology''s cited source ingested'
status: completed
type: task
priority: normal
created_at: 2026-09-22T19:34:26Z
updated_at: 2026-09-22T21:50:14Z
parent: folio-assistant-ahvw
---

Owner, this session: add methodologies as subgraphs with doc ingest into the KG, full process/skills/roles; methodologies must have an evidence base with a QA report; lit search skill where evidence is missing; evidence analysis tied into an existing process.

## Measured before starting, 2026-09-22

Six methodologies carry an `origin:` naming authors and a publication. ZERO have that source ingested into any declared library. Searched all four: cat-harness/library (empty by ruling frs5), who-iris/library, folio-assistant-sci/library, agent-skills/library. The citations resolve against nothing -- the same shape as the 260 dangling skill `roles:` values (qif9).

Two further gaps: `$schema: folio-methodology/v1` appears in 4 files and exists in NO .ts file, so nothing validates it; and test/results/ holds 8 QA axes, none about methodologies.

## Owner ruling this session, which REVERSES part of g43o

'they should be under <stub>/library and appear in the library visualizer for the harness. dont bury sub-graph assets. same for <stub>/skills, etc.'

g43o co-located CRDM's skills and eight diagrams under methodologies/crdm/. That buries sub-graph assets three levels inside another stub. The assets move to the stub-level directories; the methodology NODES stay at cat-harness/methodologies/, which is already <stub>/methodologies.

## Done when

- [x] Gurel & Tat 2017 ingested to cat-harness/library/ and visible in the harness library visualiser
- [x] cat-harness/methodologies/swot.md node, faithful rendering, origin citing the ingested bib-slug
- [x] swot-analysis.bpmn with every lane bound to a declared role and every activity carrying folio:skill
- [x] literature-search skill: open-access search, DIRECT download link, and say what the item IS when the network blocks it
- [x] methodology-evidence QA axis + report covering all six, reporting the five with no source as missing
- [x] the moves: CRDM skills -> cat-harness/skills/crdm/, CRDM diagrams -> cat-harness/processes/, RACI skill -> cat-harness/skills/raci/
- [x] documentation fixed for the moves
- [x] bun run gates green

## Summary of Changes

Five commits on `claude/magical-dijkstra-19yvml`, issue #965, PR #966.
`bun run gates` — **125/125**, two more gates than the branch started with.

- **`e20b4c4f`** — Gürel & Tat 2017 ingested to `cat-harness/library/`. The
  ingest probed the PDF and chose `pdf-pages`; 22 images were roled `figure` by
  geometry and **14 of those were wrong**. Hashing first showed 13 are
  byte-identical page furniture, so one inspection covers them honestly. Final
  roles: 13 `logo`, 8 `figure`, 1 `decorative`. Narratives are `draft` — a
  human confirms.
- **`16839c35`** — `methodologies/swot.md` (origin recorded as CONTESTED,
  because the source says no academic reference supports the usual
  attribution), `swot-analysis.bpmn` (no path through it decides anything —
  the methodology's refusal drawn rather than written), `A_CheckEvidence` in
  `options-analysis.bpmn`, and the `literature-search` and `swot-analysis`
  skills. Two empty-library tests narrowed and the rule kept in ONE place.
- **`f7025a35`** — `schemas/methodology.ts` (the tag was in four files and no
  `.ts`) and `check:methodology-evidence`. First run: 1 of 5 methodologies
  rests on a source this checkout holds.
- **`2219ef9f`** — the moves. CRDM's skills to `skills/crdm/`, RACI's to
  `skills/raci/`, eight diagrams to `processes/`, and **all three declarations
  removed rather than repointed**. Reverses the placement half of `g43o`, said
  so in the commit and on the issue.
- **`4545c577`** — `check:layout-norms`, a ratchet. It found a fourth affected
  instance my hand audit missed, and a defect in its own first draft.

### Left for the owner, not decided here

- `2xfl` — RACI is a skill, not a methodology node, so the graph reports 5.
- `a7t8` — `ingest-document`'s arm guidance double-nests `pdf-images` output.
- Four instances still nest `skills/voices`; baselined, not fixed — they are
  not this instance.
- Four methodologies still have no ingested source. `literature-search` exists
  to close them; none was run, because no one asked for those four yet.
