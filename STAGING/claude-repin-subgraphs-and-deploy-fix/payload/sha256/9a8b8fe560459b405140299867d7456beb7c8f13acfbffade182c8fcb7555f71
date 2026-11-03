---
name: dth-authoring
description: >
  How a WHO Digital Transformation Handbook (DTH) is produced, from sources to
  publication, in the seven stages and milestones of dth-authoring.bpmn — and
  the rules the diagram cannot carry: which review sheet each stage uses, the
  DAK kinds every DTH is written in, and how a term is deprecated. Read before
  starting a new DTH, before moving one to its next stage, and before setting
  up its feedback or public-comment sheet.
---

# dth-authoring

> Skill id: `dth-authoring` · Package: `authoring-who-smart-guidelines` ·
> Process: [`dth-authoring.bpmn`](../../../processes/content/dth-authoring.bpmn)
> (generated walk: [`dth-authoring.checklist.md`](../../../processes/content/dth-authoring.checklist.md)).
> Pilot: `litlfred/dth-hrh`. Issue: smart-base#248 (follows #243).

**The diagram is the authority for the steps.** This file does not restate
them. It holds the rules that apply across the steps and that the owner set
while the first DTHs were being built (2026-10-30/31).

## The stages, in one line each

| stage | ends at | what it is |
|---|---|---|
| 0 · Initiate | M0 · Charter recorded | scope, DIIG phase, TWG, roles and RACI, repository from the dth-hrh layout, work plan seeded |
| 1 · Ingest sources | M1 · Library frozen | every source into `library/` (WHO publications through who-iris), L1 coverage |
| 2 · Outline | M2 · Outline agreed | chapters against the `dth` kind, introduction, glossary candidates, list of processes, roles, decisions and indicators to model |
| 3 · Structured drafting | M3 · Zero draft | content written as DAK-kind blocks, linked to smart-ra ArchiMate and SKOS |
| 4 · Contributor feedback | M4 · Working-group draft | editors and contributors comment; change sets; issues |
| 5 · Public comment | M5, M6 | public draft released, comments dispositioned through change sets |
| 6 · QA and publish | M7 · Final published | editorial, voice and translation QA, then publication |

A milestone is recorded in the work plan when it is reached. It never blocks
work in a later stage that is ready early.

## Which review sheet, by stage

The sheet follows the stage the document is in (owner, 2026-10-31: *"sheet
depends on the stage of authoring process you are in"*).

| stage | sheet | template | mode in `review-sheet-script` |
|---|---|---|---|
| 0-3 drafting and authoring, 4 contributor feedback | **Contributor sheet**: one Contributor Feedback tab, each row a change set with its own issue; one `Contributor Feedback (<initials>)` column per person; no TWGs, no public-comment tabs | Folio Assistant - Contributor Template | `drafting` |
| 5 public comment | **Public Comment sheet**: comment source, review of public comments, change sets with TWG and architect feedback | Folio Assistant - Public Comment Review Template | `public-comment` |

How the sheets work, the template links, the generic Code.gs and its Config
tab, and the setup steps are in folio-assistant-core's
`review-sheet-script` skill. The Agent-tab rule is `review-sheet-agent-columns`.
Do not set up the Public Comment sheet before stage 5: dth-hrh in drafting
uses only the Contributor sheet.

## Every DTH is written in the DAK kinds

Owner, 2026-10-31: *"every DTH needs the DAK kinds for its user personas and
similar content"*. Content that has a DAK kind goes in that kind's block, never
only in prose or a Markdown table:

| content | DAK kind |
|---|---|
| user personas, roles, governance bodies as actors | persona, actor-definition |
| user scenarios, walkthroughs | user scenario |
| business processes | business-process (`.bpmn`, by `bpmn-authoring`) |
| decision tables | decision-logic (`.dmn`, by `dmn-authoring`) |
| data elements | core data element |
| functional and non-functional requirements | requirement |
| indicators | program indicator |

The fields of each kind are WHO's own DAK logical-model fields (smart-base#246).
The `dth` document kind admits these blocks (smart-base#242). Planning kinds
that are not DAK kinds yet (planning step, RACI, risk register,
barrier-to-solution map, stakeholder analysis, form inventory) are proposals:
they need review by the architect group and the handbook owners before any
schema is built.

## Terms

- Terms come from the source's own glossary first. See folio-assistant-core's
  `glossary-terms` skill ("Source glossary first").
- **Deprecating a term is a change set, decided later by an editor.** When a
  term is to be replaced (dth-hrh CS-001: "Core Data Element" and "CDE-HRH"
  replace "MDS-HRH" because the old term causes confusion and is not precise),
  the agent records it as a change set: the old term, the new term, the reason,
  and every place the old term appears. It changes nothing in the text. An
  editor later starts an agent review that decides it; only then is the text
  changed. Quoted source text always stays as published.

## A new DTH from an existing WHO publication

When the DTH already exists as an L1 publication, stages 0-2 are done by
[`dth-l1-to-l2-ingest`](dth-l1-to-l2-ingest.md), which writes the handbook's
workplan first.
