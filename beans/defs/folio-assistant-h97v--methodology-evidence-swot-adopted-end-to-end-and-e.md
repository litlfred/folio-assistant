---
# folio-assistant-h97v
title: 'METHODOLOGY EVIDENCE: SWOT adopted end-to-end, and every methodology''s cited source ingested'
status: in-progress
type: task
created_at: 2026-09-22T19:34:26Z
updated_at: 2026-09-22T19:34:26Z
---

Owner, this session: add methodologies as subgraphs with doc ingest into the KG, full process/skills/roles; methodologies must have an evidence base with a QA report; lit search skill where evidence is missing; evidence analysis tied into an existing process.

## Measured before starting, 2026-09-22

Six methodologies carry an `origin:` naming authors and a publication. ZERO have that source ingested into any declared library. Searched all four: cat-harness/library (empty by ruling frs5), who-iris/library, folio-assistant-sci/library, agent-skills/library. The citations resolve against nothing -- the same shape as the 260 dangling skill `roles:` values (qif9).

Two further gaps: `$schema: folio-methodology/v1` appears in 4 files and exists in NO .ts file, so nothing validates it; and test/results/ holds 8 QA axes, none about methodologies.

## Owner ruling this session, which REVERSES part of g43o

'they should be under <stub>/library and appear in the library visualizer for the harness. dont bury sub-graph assets. same for <stub>/skills, etc.'

g43o co-located CRDM's skills and eight diagrams under methodologies/crdm/. That buries sub-graph assets three levels inside another stub. The assets move to the stub-level directories; the methodology NODES stay at cat-harness/methodologies/, which is already <stub>/methodologies.

## Done when

- [ ] Gurel & Tat 2017 ingested to cat-harness/library/ and visible in the harness library visualiser
- [ ] cat-harness/methodologies/swot.md node, faithful rendering, origin citing the ingested bib-slug
- [ ] swot-analysis.bpmn with every lane bound to a declared role and every activity carrying folio:skill
- [ ] literature-search skill: open-access search, DIRECT download link, and say what the item IS when the network blocks it
- [ ] methodology-evidence QA axis + report covering all six, reporting the five with no source as missing
- [ ] the moves: CRDM skills -> cat-harness/skills/crdm/, CRDM diagrams -> cat-harness/processes/, RACI skill -> cat-harness/skills/raci/
- [ ] documentation fixed for the moves
- [ ] bun run gates green
