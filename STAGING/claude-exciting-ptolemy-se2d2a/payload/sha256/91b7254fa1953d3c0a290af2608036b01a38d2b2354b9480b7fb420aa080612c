---
# folio-assistant-95sk
title: 'FOLIO AS CONVENTION (R24, R27–R29): the folio on any harness, materialised assets and reader documents in folio/, cross-library references — wait on the split'
status: todo
type: task
created_at: 2026-09-23T17:59:01Z
updated_at: 2026-09-23T17:59:01Z
parent: folio-assistant-vke6
---

Carried over from `j2if` on 2026-09-23, on the owner's choice "Move to split, close". The source of truth for the wording is `cat-harness/docs/architecture/folio-board-requirements.md` §"The folio is a convention, not a page — R24 to R29". Quoted here so this bean can be read on its own:

| | requirement | state 2026-09-23 |
|---|---|---|
| **R24** | the folio visualisation is `cat-harness`'s, and SHALL be available by convention on **any** harness | **open.** It depends on the split: the harness has to be a layer another instance depends on. |
| **R25** | a reader SHALL be able to pull their folio down over whatever they are browsing | **met.** This is the glass: #1010, #1030, #1039 and #1095. |
| **R26** | `cat-harness` SHALL declare `folio/` as the directory of the reader's own content | **met.** It is declared in `cat-harness.json` (id `folio`) and is on disk (`8mbk`). |
| **R27** | materialised assets from the static KG SHALL live in the folio | **open** |
| **R28** | new documents a reader creates **or links to** go in `folio/` | **open** |
| **R29** | todos and sticky notes MAY reference things **across** KG libraries | **open** |

## Why here

They are declarations and paths that only mean something once the repo is split (#223). Building them before then is the `dh4f` defect on purpose: a directory declared but empty, which every consumer then scans and reports as clean.

## Done when

- [ ] R24: a second harness instance renders the folio pull-down with no code of its own
- [ ] R27: a materialised asset is written under `folio/`, and the glass reads it from there
- [ ] R28: creating or linking a document writes it under `folio/`
- [ ] R29: a todo or sticky can carry a reference into another instance's KG, and the reference resolves
