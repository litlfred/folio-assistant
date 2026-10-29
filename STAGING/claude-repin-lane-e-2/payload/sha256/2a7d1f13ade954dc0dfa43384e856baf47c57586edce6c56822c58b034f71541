---
# folio-assistant-95sk
$schema: bean/1.0.0
title: 'FOLIO AS CONVENTION (R24, R27–R29): the folio on any harness, materialised assets and reader documents in folio/, cross-library references — wait on the split'
status: in-progress
type: task
created_at: 2026-09-23T17:59:01Z
updated_at: 2026-10-24T08:50:00Z
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

- [ ] R24: a second harness instance renders the folio pull-down with no code of its own *(who-iris: met via `folio-mount.ts`. FHIR IG pages: fhir-harness#155, merged 2026-10-24 as 49da9cc; live once folio-assistant re-pins fhir-harness and republishes. Tick when `smart-base/index.html` on gh-pages carries `data-fa-folio-mount`.)*
- [x] R27: a materialised asset is written under `folio/`, and the glass reads it from there *(met as the owner ruled on 2026-09-21: the folio is the reader's REPOSITORY, of which `library/` and `uploads/` are declared parts. Bytes under `folio/` itself were rejected, because `corpus-grep` reads `library/` only and `folio/` is renderable. See `folio-board-requirements.md` §"R27 and question 1". Gated by `check-catalogue.ts`. Ticked 2026-10-24.)*
- [ ] R28: creating or linking a document writes it under `folio/` *(creating: done, cat-harness-tools#711 merged as b7b21e5, `bun run cat folio:create`. Linking: an agent can already record a link as a referenced `library/` node through `ingest-document.ts`. Still missing: the reader's "link a document" action on the glass.)*
- [ ] R29: a todo or sticky can carry a reference into another instance's KG, and the reference resolves

## 2026-10-24 — re-measured (separation drain, session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e)

Re-measured: unblocked (the split is done) but none of R24, R27, R28, R29 is started. Feature work, not a move.

_2026-10-24T08:16:00Z_ — Claimed by https://claude.ai/code/session_01WJw1NBGSTLWvBnyQzJHXjx (bean drain, stalled-triage thread).

## 2026-10-24 — measured per requirement (https://claude.ai/code/session_01WJw1NBGSTLWvBnyQzJHXjx)

- **R24: open, and measured.** The glass lives in `cat-harness/site-chrome/assets/js/docs-ui.js` (12.5k lines). It is meant for replica pages: line 973 says "a page with no sidebar (a replica, the harness page) has a glass". On `folio-assistant` gh-pages, the root `index.html` loads `docs-ui.js` and carries `fa-glass-strip`. `who-iris/index.html` and `smart-base/index.html` load neither. What both of them DO load is `navbar-row.js` and `page-layout.js`, so a harness-owned loader there is the route that needs no code of the instance's own.
- **R27: already met by the owner's ruling, so the box above is worded against it.** `folio-board-requirements.md` §"R27 and question 1" records the owner's choice that the folio is the reader's REPOSITORY, of which `library/` and `uploads/` are declared parts. Writing bytes under `folio/` was the literal reading, which was rejected: `corpus-grep` reads `library/` only, and `folio/` is renderable. The doc says "R27 is therefore already satisfied, and already gated" (`check-catalogue.ts`).
- **R28, R29: not started.** No writer puts a created or linked document under `folio/`. No todo or sticky schema carries a cross-instance reference.

**Correction, same day.** R24 is half met, not open. `who-iris/index.html` on gh-pages carries the platform's folio mount (`data-fa-folio-mount`, `cat-harness-tools/scripts/folio-mount.ts`), which appends `docs-ui.js` from an inline script. My first look only searched `<script src>`. `smart-base/index.html` carries neither, so the remaining R24 work is the FHIR IG pages.

## 2026-10-24 — owner: all four here (Q4 option B); R29 paused

The owner chose to keep R24, R27, R28 and R29 in this bean and work them in order. Then, the same morning: *"R29. dont do stickies. pause that for now."* and *"pause todos too"*. **R29 is paused in full, for both todos and stickies.** Its box stays unticked and is not worked until the owner unpauses it.

The owner, right after: *"(they should be the same thing, that's part of the problem)"*. Todos and sticky notes are meant to be **one** kind of thing, and having two is part of why R29 is paused. Whoever unpauses R29 starts from one merged kind, not two.

## 2026-10-24 — R28 ruled (owner's Q5 choice A, then refined)

The owner chose A ("read it like R27"), then refined it at 09:01:

> a document someone creates goes into folio. can be of mutliple kinds - any that hey have KG to decribe/loaded in dep chain … /mounted

So, for R28:
- A document a reader **creates** goes in `folio/`. It may be of **any kind that some knowledge graph in the instance's dependency chain describes**, including the mounted layers. So the set of creatable kinds is whatever the loaded graphs declare, not a list fixed here.
- A document a reader **links to** becomes a `referenced` node in `library/` (catalogue by reference, through `ingest-document.ts`'s referenced rung), as option A said.
