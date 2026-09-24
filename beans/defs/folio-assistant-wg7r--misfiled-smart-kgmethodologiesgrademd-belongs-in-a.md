---
# folio-assistant-wg7r
title: 'MISFILED: smart-kg/methodologies/grade.md belongs in a skill + SKOS code list, and smart-kg/ leaves this repo'
status: completed
type: task
priority: normal
created_at: 2026-09-23T22:52:50Z
updated_at: 2026-09-24T05:19:30Z
parent: folio-assistant-vke6
---

Owner, 2026-09-23: *"misfiled smart-kg/methodologies/grade.md, needs to be part of skill/SKOS etc. … dont want smart-kg here yet, that is its own repo already"*.

## What is wrong

- `smart-kg/methodologies/grade.md` (85 lines, `folio-methodology/v1`) is the only file under `smart-kg/`, a directory named after a repository that **already exists on its own**. Keeping a stub of it here is a second home for content whose home is elsewhere.
- It is declared as its own graph, `smart-kg-methodologies` in `cat-harness/cat-harness.json` (~line 793), and cited from the `methodology` entry's description ("GRADE is deliberately NOT here — see smart-kg-methodologies"), from the methodology visualiser comment, and from `smart-base/AGENTS.md:88`.
- Its enumerations (certainty: high / moderate / low / very low; the downgrade and upgrade domains; recommendation strength and direction) are **codes with definitions and a source**, which is exactly what a `folio-code-list/v1` node is for (#1170 / #1171), and those codes are published as SKOS by glossary-export.

## Proposed shape (confirm with owner before implementing)

1. GRADE's procedure goes into a skill under `cat-harness/skills/authoring-who-smart-guidelines/` (the WHO L1 package), and the skill cites the GRADE Working Group / WHO Handbook as its source.
2. Each GRADE enumeration becomes a code list in `cat-harness/code-lists/`, each code with a definition and a source, exported as SKOS.
3. Remove the `smart-kg-methodologies` declaration and the `smart-kg/` directory, and fix the three references above. Moving and deleting an artefact needs the owner's go-ahead (deletion-requires-confirmation).
4. Open question: should the content instead go to the separate smart-kg repository now? The owner said "not here **yet**".

## Done when

- [x] placement confirmed with the owner (skill + code lists here, vs. hand over to the smart-kg repo)
- [x] GRADE content lives in its confirmed home; the enumerations are code lists that `check:code-lists` validates
- [x] no `smart-kg/` directory and no `smart-kg-methodologies` declaration; `bun run gates` green (declared-but-absent is bean dh4f's defect, so the declaration goes with the directory)

## Summary of Changes

**Placement, owner 2026-09-24:** option 2, `cat-harness`, chosen over `smart-l1` and `smart-base`.

- **Skill** `cat-harness/skills/authoring-who-smart-guidelines/grade.md` (`grade`), registered in the package manifest. It is the grading SYSTEM that `evidence-appraisal` applies when a folio declares GRADE. `evidence-appraisal` now points to it as available, not as a default, so its "refuse when no system is declared" rule stands.
- **Six code lists** in `cat-harness/code-lists/`, 28 codes, each with a definition, and each list cites its published source:
  - `grade-certainty` (4): Balshem et al. 2011
  - `grade-rating-down` (5): GRADE Handbook §5.2
  - `grade-rating-up` (3): Guyatt et al. 2011
  - `grade-etd-criterion` (12): Alonso-Coello et al., BMJ 2016
  - `grade-recommendation-direction` (2) and `grade-recommendation-strength` (2): Andrews et al. 2013 and the WHO Handbook
- **SKOS:** glossary-export publishes them in `cat-harness-code-lists.jsonld`, as 12 concept schemes in total, 6 of them new.
- **A correction to the old file:** it listed 10 EtD criteria. The framework for clinical and public-health recommendations has 12; the old file omitted the certainty of evidence of required resources, and cost-effectiveness. The list and the skill now follow the source.
- **Removed:** the `smart-kg/` directory and the `smart-kg-methodologies` declaration, plus the generated UML pages for that sub-graph.
- **References:** present-tense references now name `smart-base/methodologies/` or state the move (schemas, check scripts, `directory-conventions`, `graph-detanglement` and its BPMN and `.pot`s, `smart-l1`, and the `smart-base` AGENTS.md sibling table).
- **Left alone on purpose:** architecture docs, the partition instance list and the `contributions.ts` diamond, all of which describe the FUTURE smart-kg repository.
- **Tests:** the "repository-scoped directory" example moved to `smart-base-methodologies` / `diig`, with each non-vacuity guard kept.
- **Checks:** `bun run gates` fails only on the known local-only `.claude/worktrees` items. `code-lists:check` passes.
- **Follow-up filed:** `7h1c`. `publish-verify` counts the code-lists document as "not ours" because its context binds only SKOS; it expands clean, checked by hand.
