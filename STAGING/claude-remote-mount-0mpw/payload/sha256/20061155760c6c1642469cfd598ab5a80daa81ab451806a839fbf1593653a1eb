---
# folio-assistant-61t6
title: fsh-guts checks treat a separated subtree as one frozen item described by its note
status: todo
type: bug
priority: high
created_at: 2026-10-06T20:21:29Z
updated_at: 2026-10-06T20:21:29Z
parent: folio-assistant-3tza
---

cf210f4 deposited fsh-guts/separated/{smart-base,smart-trust,smart-immunizations}/ (~7.7k files) on cat/cat-harness/fsh-guts and every PR's CI went red (export @context lacked `data`, render-pipeline tests and the page walked every file, materialized-fixity judged a frozen copy's index.json, bean refs to hupw). 611a3fd held the cutover back until #2320 merges. Platform must treat separated/<name>/ as ONE frozen item described by its sibling note (sub-kg-lifecycle stage 13) before it is re-applied.

## Done when
- export declares `data`, skips frozen subtrees
- not-rendered tests, fsh-guts page, materialized-fixity skip frozen subtrees by declaration (note kind), not by path
- tested against e62ece3's real content locally
