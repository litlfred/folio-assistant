---
# folio-assistant-61t6
title: fsh-guts checks treat a separated subtree as one frozen item described by its note
status: completed
type: bug
priority: high
created_at: 2026-10-06T20:21:29Z
updated_at: 2026-10-08T04:30:00Z
parent: folio-assistant-3tza
---

cf210f4 deposited fsh-guts/separated/{smart-base,smart-trust,smart-immunizations}/ (~7.7k files) on cat/cat-harness/fsh-guts and every PR's CI went red (export @context lacked `data`, render-pipeline tests and the page walked every file, materialized-fixity judged a frozen copy's index.json, bean refs to hupw). 611a3fd held the cutover back until #2320 merges. Platform must treat separated/<name>/ as ONE frozen item described by its sibling note (sub-kg-lifecycle stage 13) before it is re-applied.

## Done when
- [x] export declares `data`, skips frozen subtrees
- [x] not-rendered tests, fsh-guts page, materialized-fixity skip frozen subtrees by declaration (note kind), not by path
- [x] tested against e62ece3's real content locally

## Completed on landed evidence
Landed on main in commit e3ad680b7381 ("fsh-guts: a separated subtree is one frozen item described by its note (bean 61t6)") and e46733ca6043 ("skill:register: regenerate artefacts for the sub-kg-lifecycle section (bean 61t6)").
- Added `isFrozenSubtree`, `frozenSubtreeNote`, `withoutFrozenSubtrees` in `schemas/fsh-guts.ts`.
- `fsh-guts-export.ts` declares `data` in `@context` and skips frozen subtrees.
- `gen-fsh-guts-viz.ts` renders frozen subtree as single 'via sidecar' row.
- Unit tests added in `fsh-guts-frozen-subtree.test.ts`, `fsh-guts-not-rendered.test.ts`, and `fsh-guts-bean-refs.test.ts`.
- All criteria verified on main.
