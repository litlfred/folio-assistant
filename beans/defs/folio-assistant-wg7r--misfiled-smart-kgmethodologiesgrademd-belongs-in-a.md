---
# folio-assistant-wg7r
title: 'MISFILED: smart-kg/methodologies/grade.md belongs in a skill + SKOS code list, and smart-kg/ leaves this repo'
status: todo
type: task
priority: normal
created_at: 2026-09-23T22:52:50Z
updated_at: 2026-09-23T22:52:50Z
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

- [ ] placement confirmed with the owner (skill + code lists here, vs. hand over to the smart-kg repo)
- [ ] GRADE content lives in its confirmed home; the enumerations are code lists that `check:code-lists` validates
- [ ] no `smart-kg/` directory and no `smart-kg-methodologies` declaration; `bun run gates` green (declared-but-absent is bean dh4f's defect, so the declaration goes with the directory)
