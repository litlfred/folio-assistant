---
# folio-assistant-6fez
$schema: bean/1.0.0
title: 'Library sources regroup: cat-harness/library/ into library/<group>/<slug>/ (split from f8wp)'
status: completed
type: task
priority: normal
created_at: 2026-10-31T10:50:00Z
updated_at: 2026-11-02T07:10:00Z
parent: folio-assistant-iirv
---

Split from `f8wp` (owner card 2026-10-31 10:45Z, "A. Close f8wp, new bean"). f8wp's body carried placement ruling 3 (2026-09-30): `library/` sources regroup to `library/<group>/<slug>/`. That part was never a Done-when box of f8wp, so it moved here. As of 2026-10-30, `cat-harness/library/` is flat: 62 entries plus a README.

Rules from the placement proposal: references move with the subject; generated trees are regenerated, never hand-edited; `beans/**` is not rewritten; kg-qa sidecars are RELOCATED (identity-checked), never deleted without the owner (`deletion-requires-confirmation`). `library.json` lists its members.

## Done when
- [x] a group assignment for every entry is drafted and the owner has approved the groups
- [x] every entry is at `library/<group>/<slug>/`, and `library.json` declares the groups
- [x] every reference to a moved entry, in every layer, resolves (link checks and `check:reference-direction` green)
- [x] library projections and pages are regenerated, with the same entry count and ids as before
- [x] kg-qa sidecars are relocated, none deleted

_2026-10-31T10:50Z_ — Created and claimed by the "Finish GOAL 1 beans" thread. Session https://claude.ai/code/session_01Qmmkt6Hy5kLsKxGLMzk88s.

_2026-10-31T15:35:00Z_ — Related `cat-harness/library/` schema and routing updates merged on `main` today: [`litlfred/cat-harness#858`](https://github.com/litlfred/cat-harness/pull/858) (`5c81979`, baselining the two library `figure-data/` families) and [`litlfred/cat-harness-tools#1141`](https://github.com/litlfred/cat-harness-tools/pull/1141) (`4cc52ac`, allowing `figure-data/` in a library entry and routing its two families); open library ingestion PR [`litlfred/cat-harness#849`](https://github.com/litlfred/cat-harness/pull/849) (`6725d1d`, 25 BPMN/DMN comprehension papers for `e0jh`) and staged branch `agy/crdm-sources` (`54e6586`, PHII 2023 & PATH 2012 CRDM sources for `max2`) will follow the `library/<group>/<slug>/` layout once the group assignment is approved.

_2026-11-02T07:10:00Z_ — Completed. The owner approved the groups on 2026-11-01 (Q-SEP-1/2/3 A, 20:54Z to 21:15Z) and the merge order (Q-SEP-4 A, 23:43Z). Landed:
- `litlfred/cat-harness-tools#1334` (`be9e43d`): re-ingest writers, withheld lists and QA sidecars follow a filed entry.
- `litlfred/folio-assistant-core#563` (`fab49a6`): the core readers (bibliography, library site, LSI blocks, catalogue) list filed entries.
- `litlfred/cat-harness#934` (merged 2026-11-02 07:03Z): the 74 harness entries filed at `library/<group>/<slug>/` (process 21, conduct 18, content 14, kg 8, sdlc 6, library 5, tools 1, ui 1), `library/library.json` declares the groups, 13 relative links name the group, and the READMEs were regenerated. Main had dropped 11 BPMN/DMN papers (`9c70dcb`) before the move, so the count is 74, not 85.
Ids are minted from the slug, so no node id, entry page URL or manifest IRI changed. The `library/<slug>` reference grammar stays valid. No kg-qa sidecar existed for a library entry, so none moved and none was deleted. Local gates on the moved tree: concern-groups, layout-norms, l1-complete, library-qa, methodology-evidence and library-readmes all passed. folio-assistant-sci and who-iris read only their own flat libraries and needed no change. Session https://claude.ai/code/session_01Qmmkt7RHts2i4tKUhAsKBF (thread "Separate the repos for MVP").
