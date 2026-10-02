---
# folio-assistant-dlqu
title: 'SPEED-UP 4: CI sharding, BPMN render cache and shallow checkout'
status: in-progress
type: task
created_at: 2026-10-01T17:42:24Z
updated_at: 2026-10-02T22:08:56Z
parent: folio-assistant-7x5n
---

Owner approved 2026-10-01 late (~17:30, session_01ToWZR4RgTRCWeSsgxsSQfT) as speed-up 4 of 4 for the merge treadmill (S2 `0mf0`, epic `7x5n`). Siblings: input-hash skip, parallel checks, CI merge:main (`d33q` part B).

## What
Three CI changes to `.github/workflows/code-quality-gates.yml` (and the other gate workflows):
1. **Sharding** — split the long `gates` job (and `bun test`) into parallel shards with a final aggregate status, so the slowest job sets the wall-clock rather than the sum.
2. **BPMN cache** — cache the rendered BPMN / UML outputs keyed by the hash of their inputs, so `render:bpmn:check` and friends do not re-render unchanged diagrams.
3. **Shallow checkout** — `fetch-depth` as small as each job allows; jobs that genuinely need history (merge-base, rename detection) say so.

## Falsifier
A shard that silently runs nothing is green. So: the aggregate must check that every gate ran in exactly one shard (the union of shards = `gates.ts`'s derived list). A cache keyed on less than the real inputs serves stale renders; key on the same declared inputs as the input-hash skip. A shallow job that needs history must fail loudly, never fall back to "no renames" (cf. the reference-direction ratchet's `could not determine renames`).

## Note
Another agent is editing `code-quality-gates.yml` for this; other PRs keep their workflow edits to single added steps so merges stay trivial.

## Done when
- [ ] shards + aggregate, with a test that every gate is in exactly one shard
- [x] ~~BPMN render cache keyed on inputs~~ — measured, not worth building (see Re-scoped)
- [x] ~~per-job fetch-depth~~ — already depth 1 everywhere in this workflow (see Re-scoped)
- [ ] measured: CI wall-clock before/after over ≥3 runs

_2026-10-02T22:08:54Z_ — Claimed by claude/zealous-thompson-y8dcf1 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Baseline, measured 2026-10-02 (session_01Jf39Vh4B8EQT6TBYzTtMCA)

`Code-quality gates` on `main`, last three completed push runs, job and step
times read from the Actions API (not estimated):

| run (merge) | wall-clock | TypeScript job | its `bun test` step | Repository gates | e2e | `render:bpmn:check` | checkout |
|---|---|---|---|---|---|---|---|
| #1895 `49c3ff2fe` | 8m18s | 8m14s | 7m30s | 5m40s | 5m25s | 2s | 10–13s |
| #1911 `909678c89` | 8m36s | 8m33s | 7m45s | 5m35s | 5m36s | 2s | 10–12s |
| #1923 `d59cab3bc` | 8m33s | 8m30s | 7m43s | 4m55s | 7m05s | 4s | 11–19s |

The critical path is the TypeScript job, and ~90 % of it is one step.

## Re-scoped by that measurement — two of the three items buy nothing

- **BPMN render cache: not built.** `rendered BPMN SVGs are current` takes
  2–4 s, inside `e2e`, which is not the critical job. The most a cache could
  save is 4 s of a job that is already off the wall-clock path.
- **Shallow checkout: nothing to do here.** `code-quality-gates.yml` sets no
  `fetch-depth` anywhere, so every job already takes the `actions/checkout`
  default of 1. Checkout costs 10–19 s per job, run in parallel.
- **What remains is `bun test`.** Bun 1.3.14 (the pinned version) has both
  `--shard=i/N` and `--parallel=N`; runners have 4 cores.

A constraint the work must respect: `gatesFrom` (`gates.ts`) splits a `bun`
line on whitespace and runs it with NO shell, so a `${{ matrix.* }}` or `$VAR`
in a `bun` line reaches the local gate run as literal text — the `9zok` shape.
