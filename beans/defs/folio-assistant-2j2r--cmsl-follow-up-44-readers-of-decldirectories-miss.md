---
# folio-assistant-2j2r
title: 'cmsl follow-up: ~44 readers of decl.directories miss entries declared from within'
status: todo
type: bug
priority: normal
created_at: 2026-09-30T17:24:45Z
updated_at: 2026-09-30T18:22:23Z
parent: folio-assistant-vke6
---

## What

Since cmsl step 1 (2026-09-30), `voices/` and `skills/lean/` are declared FROM WITHIN `skills/skills.json`, not in `<instance>.json`. `resolveDirectories` promotes them; but ~44 call sites read `readDeclaration(root).directories` directly and never see them.

Measured the same day: the UML overview deleted 5 voices diagrams, `check:wireframes` called 5 voices pages undeclared, and `viewer-tools.test.ts` found `voices` rendered but undeclared — all with nothing else red. Those three now use `instanceDirectories(root)` (schemas/cat-harness.ts): authored entries + own from-within entries.

## Remaining sites

`git grep -n "decl\??\.directories" -- '*.ts'` — triage each: does it enumerate an instance's sub-graphs (→ `instanceDirectories`), or does it want the declaration AS AUTHORED (sync-docs-harness says so explicitly; check-declared-dirs validates the file itself)?

Enumerators most likely affected: harness-tiles, check-docs-populated, subgraph-readmes (both copies), check-subgraph-coverage, state-visualizer, compose-docs, readme-sections, liquid-values, gen-handler-index, check-read-only-graphs, check-retired-front-matter, kg-validate `kindForPath`.

## Done when

- every site is either on `instanceDirectories` or carries a one-line reason it wants the authored list;
- a before/after diff of each changed generator's output shows voices/lean reappearing and nothing else moving.


## 2026-09-30 — first sweep
Fixed (now on `instanceDirectories`): gen-uml-overview, check-wireframes, viewer-tools.test, **harness-tiles** (SMART Base's voices navbar tile had vanished — main had it, the cmsl step-1 head did not), **check-subgraph-coverage** (stopped auditing the 5 voices entries: 235 → 242 findings, the 7 being those audits returning plus sci's lean-skills).

Triaged, no behaviour change today (filter kinds/instances nothing has moved inward): check-docs-populated (docs), compose-docs (docs, cat-harness only), state-visualizer (state kinds), gen-handler-index + sync-docs-harness (cat-harness tiles only). Guarded by a --check gate that would go red: readme-sections, subgraph-readmes ×2.

Still to triage: the rest of `git grep -n "decl\??\.directories" -- '*.ts'`.
