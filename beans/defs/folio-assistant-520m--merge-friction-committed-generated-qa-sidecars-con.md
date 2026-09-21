---
# folio-assistant-520m
title: 'MERGE FRICTION: committed generated QA sidecars conflict on every base merge — 3 of 3 in one session'
status: todo
type: task
priority: normal
created_at: 2026-09-21T20:08:34Z
updated_at: 2026-09-21T20:08:34Z
parent: folio-assistant-1xhc
---

Measured on PR #773, 2026-09-21, across one working session.

`main` moved three times while the branch was alive — 109, 38 and 20 commits —
and **every one of the three merges conflicted, and every conflict was in a
committed generated QA sidecar.** Not once in authored code.

| merge | main moved | conflicts | all generated? |
|---|---|---|---|
| 1 | 109 commits | `qa-sweep.ts`, `folio-assistant-sci.config.json` | no — 2 structural |
| 2 | 38 commits | 3 x `translation-qa` (agent-onboarding ar/fr/ru) | **yes** |
| 3 | 20 commits | the same 3, plus `kg-qa/.../voice-authoring-guidance.kg-qa.json` | **yes** |

Each was resolved the same way: take either side, re-run the generator
(`translation-block-qa.ts`, `kg:audit`). **Coverage and verdicts were
unchanged every time** — what conflicts is a hash both sides recomputed
against their own tree.

## Why this is not just noise

A conflict an agent resolves by running a generator is a conflict that carried
no information. It costs a merge, a regeneration, a full gate run and a push
— and it teaches whoever hits it that conflicts in `test/results/` are safe to
resolve without reading, which is exactly the habit that will wave through the
one that is not.

`agent-onboarding.{ar,fr,ru}` conflicted in BOTH sidecar merges, which
suggests a small set of files is doing most of the churn rather than the
corpus as a whole.

## NOT decided

Whether the answer is (a) a merge driver / `.gitattributes` union or
`ours`-plus-regenerate strategy for `test/results/**`, (b) narrowing what a
sidecar stores so the volatile part is derived rather than committed, (c)
leaving it — these sidecars are committed on purpose, because a printed
verdict is gone and this repository wants "unaudited since it was drawn"
distinguishable from "broken in the commit under review", or (d) something
else.

(c) is a real option and this bean should not assume otherwise. The cost
measured here is three merges in one session, not a broken invariant.

## Done when

- [ ] the owner has settled whether this friction is worth machinery
- [ ] if so: a strategy that cannot silently drop a REAL sidecar change,
      because "regenerate on conflict" applied blindly would
- [ ] whichever way it goes, the reason is written where the next agent
      resolving one of these will find it
