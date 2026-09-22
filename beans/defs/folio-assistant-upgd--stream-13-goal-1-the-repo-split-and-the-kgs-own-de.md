---
# folio-assistant-upgd
title: 'STREAM 1/3: GOAL 1 — the repo split and the KG''s own declaration (vuip + zzmr, 47 open beans)'
status: in-progress
type: task
priority: high
created_at: 2026-09-22T18:08:55Z
updated_at: 2026-09-22T18:08:55Z
parent: folio-assistant-vuip
---

## What this is

A **consolidation claim**, not new subject matter. The work plan stalled: between
11:00Z and 15:19Z on 2026-09-22 seventeen PRs merged, and **nothing merged in the
2h40m after**. CI is not the cause — `check:ci-health` reports all eight
workflows that ran in the window green, 48 Pages deploys succeeded and 0 failed.
What stalled is that PRs went **conflicted** against a `main` moving ~128 commits
a day, and 95 beans sat `in-progress` with no session behind any of them.

The owner chose, 2026-09-22, to consolidate into **three streams aligned strictly
to the GOAL milestones**, accepting the stated trade-off: PR unblocking folds
into whichever stream trips over it, and no stream owns the stale-`in-progress`
cleanup as such.

This bean is stream 1 of 3. It owns **GOAL 1 (`vuip`) plus the KG epic (`zzmr`)**
— 47 open beans — because the split and the graph's own declaration are one
surface: `rnfl` renames `content/` → `folio/`, `hs08` says that rename has
reached the declaration and nothing that reads it, and `x4a6` is blocked on
core's folio registration. Those are the same edit seen from three sides.

## What this stream owns

**Beans** — `vuip` (21 open) and `zzmr` (26 open).

Critical path as `vuip` states it: `wggr` (invert the stub pattern) → `zlmp`
(drain wrong-direction import edges) → `rnfl` (the 2,408-occurrence rename),
with `x3bd`, `hfkl` and `x4a6` on the declaration layer.

**Pull requests on this surface** — every one measured 2026-09-22T15:2xZ:

| PR | state | note |
|---|---|---|
| #954 | **clean** | closes bean `itka`; 1 file; mergeable now |
| #938 | **dirty** | `feature` is a tier — **#953 merged that same work at 15:18Z**; verify superseded, then close |
| #951 | **dirty** | `check:bean-blocks`; 17 files |
| #944 | unknown | `tebu` — orphan sweep measured at 0 MiB; 266 files |
| #731 | unknown | spec-kit methodology; ~550 commits behind; author is not this session |
| #750 / #737 / #231 | stale 1–4 days | Windows / cross-platform; relates to `4dbr` forge portability |
| #907–#915 | untouched since 09:56Z | 10 dependabot PRs — three are the SAME `zod` 3→4 bump in three directories, so they collapse to one decision; `typescript` 5/6→7 is a separate and larger one |

## First three moves

1. **Re-verify the critical path before acting on it.** Bean `k59d` records that
   milestone critical paths go stale — `p5wm` and `yg29` both advertise blockers
   that are already complete. Check `vuip`'s and `zzmr`'s against the store
   first; an agent that trusts a stale path spends its session on a closed box.
2. **#954, then #938.** #954 is one file and clean. #938 is four files and its
   content appears to have landed as #953 — establish that by reading both
   diffs, not by matching titles, then close it with the evidence.
3. **The dependabot batch as one decision, not ten.** State what breaks under
   `zod` 4 and `typescript` 7 before merging either.

## Not this stream

The rendered surface (`p5wm`, stream 2) and who-iris (`yg29`, stream 3). Ingest
(`slw1`), deployment (`5a3l`), translation (`bzyu`), content model (`0lmb`),
memory (`8jt6`) and docs (`2upx`) — 49 beans — are parked by the owner's choice
of a three-stream split, not overlooked.

## Done when

- [ ] `vuip` and `zzmr` critical paths re-verified against the store, stale
      blockers withdrawn with their reasons
- [ ] #954 merged; #938 resolved (merged or closed on evidence)
- [ ] #951, #944 conflict-free and green, or a stated reason they are not
- [ ] The 10 dependabot PRs triaged with a recorded decision per major bump
- [ ] #731, #750, #737, #231 each either advanced or given an owner question
