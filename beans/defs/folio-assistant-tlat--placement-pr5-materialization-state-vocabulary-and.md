---
# folio-assistant-tlat
title: 'Placement PR5: materialization state vocabulary and the extraction contract move down to cat-harness'
status: todo
type: task
created_at: 2026-10-01T06:58:01Z
updated_at: 2026-10-01T06:58:01Z
parent: folio-assistant-iirv
---

Placement proposal §2 (owner rulings 2026-09-30 §6; process: review → resolve issues → staged PRs). Parent of PR0/PR1 is `9umr`; PR2–PR9 sit under the separation epic because D4 (owner, 2026-10-01, option 3) interleaves them with the split stages into one ordered sequence. Every PR: references move with the subject; generated trees regenerated, never hand-edited; `beans/**` not rewritten; kg-qa sidecars RELOCATED (identity-checked), never deleted without the owner (`deletion-requires-confirmation`).

PR5, ruling 2 (2026-09-30): A — only the materialization **state vocabulary** (states, fixity) moves down from `folio-assistant-core/schemas/materialization.ts` into the harness; `extraction.ts` and `extract-assets.ts` move down (the tool behind the harness's `asset-extraction`); the five-gate process stays in large-datasets; core's `sample-import-run.ts` moves beside `sample-import` in large-datasets (also `w2gr` blocker 2). Plus the ruling's addition: a remote-KG subscription is a materialization whose minimum is the chosen subgraphs' metadata under `library/<source>/`.

Under D1 (2026-10-01) the moved code lands in cat-harness-tools if stage 1a has run (it has, by the D4 order) — so "down to cat-harness" means the harness's code half.

## Done when
- [ ] `yj6r`'s instance-boundary escape count drops by the materialization and extraction clusters (3), measured with `yj6r`'s own command
- [ ] no new cat-harness → core import (`check:import-direction --all` green)
- [ ] the harness resolved alone type-checks `asset-extraction`'s tool
