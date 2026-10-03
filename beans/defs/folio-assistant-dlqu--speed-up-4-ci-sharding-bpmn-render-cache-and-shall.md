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
- [x] parallelism: `bun test --parallel` in-job; e2e as 3 shards + an aggregate that is red unless every shard succeeded; unrun-gates step in its own job
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

## After `bun test --parallel` — measured, and the count gap explained

Local (4 cores, `BUN_OPTIONS=--smol`): sequential 903 s, 14,136 pass / 57 skip
/ 4 fail (all four 5.4–6.7 s timeouts against Bun's 5,000 ms default — this
container's slowness, all four green in CI); `--parallel` 364 s, 14,140 pass /
52 skip / 0 fail. CI, dispatched run on `16c43cf40`: the `bun test` step
**3m28s** (was 7m30s–7m45s), the TypeScript job 4m13s, the workflow 5m20s —
e2e (5m16s, playwright 4m33s at `workers: 1`) became the critical path, which
is why e2e was sharded and the 1m46s–2m28s unrun-gates step split out.

**The 5 tests the parallel count lacks are never-executed ones, and their
absence is the correct state.** All 5 are the per-package block in
`lean-projects.test.ts` (`for (const pkg of LEAN_PACKAGES) describe.skipIf(!folio)…`),
skipped in BOTH modes because the platform has no folio. They are REGISTERED
sequentially only because `lean-ref-coverage.test.ts` calls
`configureLeanPackages()` and leaves the module-level registry populated for
every file loaded after it. Under `--parallel` (which implies `--isolate`) each
file starts with the registry empty, so the loop registers nothing. Measured by
per-test JUnit over the full sequential run vs the same 11 skip-bearing files
run alone: identical skip sets except those 5 names. No test that executes is
lost; the leak is a latent order-dependence `--isolate` removes.

**Bun defect found on the way:** `bun test --parallel --reporter=junit` hung
for 2,086 s (one worker at 99 % CPU) on 11 files that finish in 5 s without
`--reporter=junit`. CI does not use that reporter; anyone who adds it to the
parallel step will hit this.

## Parallel tests surfaced three tests that wrote into the real checkout

`--parallel` runs test files concurrently against ONE working tree. Three
latent races appeared, each a different pair of files per run — the shape that
gets called a flake and re-run. None is a Bun bug; each is a test writing where
another test reads.

| writer | what it wrote | reader that broke | evidence |
|---|---|---|---|
| `navbar-consistency.test.ts` | planted `"icon": "no-such-image"` in the REAL `cat-harness.json` / `folio-assistant.json`, restored after | any test reading the declarations (MCP tool groups, implementing-path) | CI shard 1 on `1b77432d2`; local error text names the planted icon |
| `repo-files.test.ts` | an untracked probe in the real `cat-harness/scripts/` | `ns-export-skos.test.ts` (enumerates the tree) | paired: 4/4 fail; alone 0/3; after the fix 0/6 |
| 4 tests with an in-tree `__test_*__` dir (`po-resolve`, `pipeline-plugins`, `contributions`, `harness-config` — the last holds a fake instance declaration) | scratch directories inside the checkout | anything that enumerates untracked files | latent; moved pre-emptively, all 80 of their tests green from `tmpdir()` |

Fixes: the navbar test plants in a symlinked COPY of the tree; the repo-files
probe lives in a throwaway `git init` repository; the four scratch dirs moved
to `mkdtempSync(tmpdir())`. Rule for the next author: **a test writes under
`tmpdir()`, never under the checkout** — the parallel runner makes every
in-tree write somebody else's race.

`registry.test.ts` still renames `.claude/skills/registry.json` (untracked,
generated) and restores it; nothing measured reads it concurrently, so it is
left and named here rather than changed blind.
