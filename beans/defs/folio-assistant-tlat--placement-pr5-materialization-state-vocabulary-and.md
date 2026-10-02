---
# folio-assistant-tlat
title: 'Placement PR5: materialization state vocabulary and the extraction contract move down to cat-harness'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T06:58:01Z
updated_at: 2026-10-02T13:42:04Z
parent: folio-assistant-iirv
---

Placement proposal §2 (owner rulings 2026-09-30 §6; process: review → resolve issues → staged PRs). Parent of PR0/PR1 is `9umr`; PR2–PR9 sit under the separation epic because D4 (owner, 2026-10-01, option 3) interleaves them with the split stages into one ordered sequence. Every PR: references move with the subject; generated trees regenerated, never hand-edited; `beans/**` not rewritten; kg-qa sidecars RELOCATED (identity-checked), never deleted without the owner (`deletion-requires-confirmation`).

PR5, ruling 2 (2026-09-30): A — only the materialization **state vocabulary** (states, fixity) moves down from `folio-assistant-core/schemas/materialization.ts` into the harness; `extraction.ts` and `extract-assets.ts` move down (the tool behind the harness's `asset-extraction`); the five-gate process stays in large-datasets; core's `sample-import-run.ts` moves beside `sample-import` in large-datasets (also `w2gr` blocker 2). Plus the ruling's addition: a remote-KG subscription is a materialization whose minimum is the chosen subgraphs' metadata under `library/<source>/`.

Under D1 (2026-10-01) the moved code lands in cat-harness-tools if stage 1a has run (it has, by the D4 order) — so "down to cat-harness" means the harness's code half.

## Done when
- [ ] `yj6r`'s instance-boundary escape count drops by the materialization and extraction clusters (3), measured with `yj6r`'s own command — **NOT tickable as written: it reads 0 before AND after.** See Summary.
- [x] no new cat-harness → core import (`check:import-direction --all` green)
- [x] the harness resolved alone type-checks `asset-extraction`'s tool

_2026-10-02_ — Claimed by claude/placement-pr5-tlat (session https://claude.ai/code/session_01CVVoavPoCHMLA7AASxG8cH), assigned by the merge steward.

## Summary of Changes — 2026-10-02, branch `claude/placement-pr5-tlat`, PR #1867, issue #1866

**Landed** (commit `6f259e2c5`):

    MATERIALIZATION_STATES + FixitySchema  core/schemas/materialization.ts -> cat-harness/schemas/materialization-state.ts (core imports + re-exports; gates, purposes, record stay)
    folio-assistant-core/schemas/extraction.ts   -> cat-harness/schemas/extraction.ts
    folio-assistant-core/scripts/extract-assets.ts -> cat-harness-tools/scripts/extract-assets.ts

The remote-KG-subscription addition is recorded as vocabulary in
`materialization-state.ts`'s module doc, nothing built. `graph-kind-registry`'s
`folio-extraction/v1` validator is now instance-local. References moved with
the subject; generated trees regenerated; no kg-qa sidecar had to move (none
exists for either schema).

**Why the Zod went to `cat-harness/schemas/` and not `cat-harness-tools/schemas/library/`**
(the placement audit's target row): stage 1b (`8lcl`) has not run, so all ~205
Zod modules still live in `cat-harness/schemas/`, and `cat-harness-tools/schemas/`
is declared `code` ("nothing here is a schema definition"), so a schema there
would be invisible to `schemaRoots` and the schema docs. `bf5l` set the
precedent for exactly this move. 1b carries both files with the rest. The
script, which is code, did go to `cat-harness-tools` (D1).

**Measured:**

    yj6r escape imports (harness -> sibling, by resolved specifier)   0 -> 0
    check:import-direction --all                                      green, 0 wrong-direction in every instance
    check:partition                                                   0 wrong-direction, 0 unassigned
    extract-assets.ts type-checked alone (tsc, files: [it])           exit 0; closure = cat-harness/schemas/extraction.ts + cat-harness-tools/scripts/lib/roots.ts

Box 1 cannot drop by 3 because those clusters were already driven out of
`cat-harness/` by `yj6r`'s tranches on 2026-09-30, by moving the CONSUMERS UP
(`extract-assets.ts`, `cache-index.ts`, fixity scripts -> core); `ybp4` then
took the count to 0. This bean was written against the 15 baseline. The
equivalent outcome — the extraction pair's literal upward references out of
the harness (`graph-kind-registry`, `asset-extraction.md`) — is gone.

**NOT done — `sample-import-run.ts` stays in core, pending a ruling.** Its
closure imports `schemas/catalogue.ts`, `PUBLICATION_GATES` (the five-gate
half the ruling keeps in core), `sample-import-check.ts` (which imports
`schemas/dublin-core.ts`) and `source-liveness.ts`. Moving it beside
`sample-import` in cat-harness / cat-harness-tools would create four
tools -> core imports, or drag content schemas down (`yj6r`'s "cheap fix is
WRONG"). Left `in-progress` for that one item.
