---
# folio-assistant-lpcs
$schema: bean/1.0.0
title: 'layer-pr-checks speed: reuse the base verdict, select affected gates, shard the gates across jobs'
status: in-progress
type: task
priority: high
created_at: 2026-10-15T20:30:00Z
updated_at: 2026-10-16T07:18:00Z
parent: folio-assistant-hfag
---

## The ask, owner 2026-10-15, verbatim

Session `session_01XZ5H7vswrTg7r3Kv2k2EhZ`, on
litlfred/smart-immunizations-uganda#4 (5 files, workflow-only):

| why so slow to run CI? this is small, no?

The three speedups offered were (1) reuse the base verdict, (2) affected-test
selection and (3) sharding the suite across parallel jobs. The owner answered:

| 1 2 (i thought already done) 3

## Measured 2026-10-15, before anything was written

Run 38784912691 (`Harness PR checks`, uganda#4, head `3a9764f`, index mode),
step times from the Actions jobs API:

| job | wall | of which `Gates` | of which `bun test` | setup (mount, install, Chromium, state) |
|---|---|---|---|---|
| base — tests and gates | 43m29s | 2514 s (41m54s) | 0 s | ~85 s |
| head — tests and gates | 45m15s | 2637 s (43m57s) | 0 s | ~70 s |
| Typecheck | 32 s | | | |
| compare | 7 s | | | |

The next push (run 38795881496): head 38m15s; base still running past 38 min.

- **It is all gates. None of it is tests.** In index mode with no
  `test-path`, `bun test` runs nothing (`layer-pr-checks.yml:497-499`).
- `run-gates.py fa --list` on the uganda root: **298 gates run, 13 skipped**,
  over the dependency harness smart-immunizations-uganda, smart-base,
  fhir-harness, folio-assistant-core, cat-harness, cat-harness-tools,
  bootstrap, bootstrap-tools. That is about 8.6 s a gate.
- **They run one at a time.** `gate-jobs` defaults to `1`
  (`layer-pr-checks.yml:74-78`, `run-gates.py:374-376`), and no caller passes
  it. The thread pool in `run-gates.py` cannot be raised safely: it runs
  every gate in it, including gates that write, unlike `gates.ts`, which pools
  only the `outputs: []` ones (`task-io.ts`).
- Base and head each run all 298, so a PR costs about 88 runner-minutes. The
  base side re-judges a main that was already judged on its own push.
- The per-gate times could not be read. The log and artefact host
  (`*.blob.core.windows.net`) is refused from this session, and
  `run-gates.py` records no duration in `gates.json`.

## What exists, and whether layer-pr-checks uses it

| # | mechanism | where | wired into layer-pr-checks? |
|---|---|---|---|
| 1 | Verdict reuse, bean `qbco` (completed). A push to main reuses the PR run that tested the same tree. | `folio-assistant/.github/workflows/code-quality-gates.yml:494-552` (job `verdict-reuse`), `:640-644` (records `tested-tree:`); `cat-harness-tools/scripts/verdict-reuse.sh` (the 8 skippable job names are hard-coded at `:48-49`) | **No.** It also answers a different question: push-reuses-PR, not PR-base-reuses-main. Nothing caches a base side. |
| 2a | Changed-path selection of verify/write pairs, bean `94zs` | `cat-harness-tools/scripts/changed-paths.ts`, `regen-after-merge.ts:118-154` (`regen --changed <base>`) | **No.** It covers `regen` pairs only, not `bun test` and not `run-gates.py`. |
| 2b | Input-hash skip, beans `xpcu` and `f017` | `cat-harness-tools/scripts/input-hash.ts`, `gates.ts:1915-1938` | **No.** It is local only and off under `CI` (`gates.ts:2286`). Every skippable declaration is `{tracked}`, so any PR moves every fingerprint. |
| 2c | The CI cone, bean `4rbc` (in progress). A gate skips when the files that main's green run read (traced) are unchanged. | `cat-harness-tools/scripts/ci-cone.ts` (`:32` "Not wired into the workflow yet"), `scripts/gate-shell.sh:61-81` | **No.** It is not in folio-assistant's workflow either. It covers only the cheap, traceable gates (36 of 53, about 30 s). |
| 3 | Sharding, beans `dlqu` and `doxj` | `code-quality-gates.yml:792-829` (bun test, 4 shards via `BUN_OPTIONS: --shard=N/4`, `:970`) and `:3807-3951` (e2e, 3 shards via `E2E_SHARD`). Gates are split by job (`gates-kg`, `gates-docs`, `gates-standalone`). | **No.** layer-pr-checks has one machine per side (`matrix.side: [base, head]`, `:300-303`). |

So the owner was half right on (2). Affected selection exists for `regen`
pairs (`94zs`) and as the unwired CI cone (`4rbc`). Neither reaches tests or
`run-gates.py`, and tests are not where the time goes.

## Plan, in the order of what it saves

1. **Shard the gates (3), the biggest and safest win.**
   - Make the `run` job's matrix `side: [base, head]` × `shard: [1..N]`, with
     a new input `gate-shards`, default 4.
   - `run-gates.py` reads `GATE_SHARD=i/N` and runs the gates whose position
     in the sorted derived set falls in shard `i`. Writers stay safe because
     each shard has its own checkout.
   - Record `seconds` per gate in `gates.json`. Once times exist, balance the
     shards by them; until then a round-robin split is used.
   - Upload `results-<side>-<shard>`. `compare` merges the shards of each side
     before it compares, and fails as could-not-determine when a shard is
     missing.
   - In layer mode, pass the same shard as `BUN_OPTIONS=--shard=i/N`, as
     folio-assistant does.
   - Expected: about 44 min becomes about 11 min plus about 1.5 min of setup
     per side.
2. **Reuse the base verdict (1).** Today the base side repeats main's own
   judgement.
   - Key the base side's `junit.xml` and `gates.json` on everything the base
     verdict is a function of:
     - the root commit (the index-mode `HEAD^1`, or the layer-mode index pin);
     - the caller's base commit;
     - the `ls-remote` sha of each layer taken at main;
     - the `tools-ref` sha;
     - the bun version;
     - the shard layout;
     - the heads of the state branches it mounts.
   - Then `actions/cache/restore` it. On a hit, skip every heavy step on that
     side.
   - The cache is warmed by a run on push to the caller's default branch. A
     PR's cache is invisible to other PRs; only default-branch caches are
     shared.
   - Could-not-determine is never a hit: any key part that cannot be read
     means a miss.
   - **Owner decision needed.** Whether the state-branch heads (beans moves
     constantly) are in the key. Leaving them in keeps judgement exact but
     lowers the hit rate. Taking them out risks charging a state change to
     the PR.
3. **Affected selection (2), wired last, because it saves least today.**
   - Route `run-gates.py`'s commands through `gate-shell.sh` once `4rbc`
     records on main. Until the expensive gates (`kg:audit*`,
     `skill:register:check`) are traceable, this saves little.
   - There are no tests to select in index mode, so test-level selection is
     out of scope until a layer-mode caller's `bun test` is measured as a
     real cost.

## 10 slowest gates of the dependency harness (measured 2026-10-16)

Measured from `litlfred/smart-immunizations` run `38819372825`, job `116719930512` (`compare`, merging 4 shards, 312 gate entries):

| # | Gate | Base (s) | Head (s) | Note |
|---|---|---|---|---|
| 1 | `cat-harness-tools:post-merge:regen:check` | 1200.1 | 1200.0 | Hits the 1200 s per-gate timeout — runs the gate set's `:check` halves inside the gates (exempted in `gates.ts` `OWN_SCRIPT_EXEMPTIONS` for the same reason as `check:merged`) |
| 2 | `cat-harness-tools:check:cat-harness-tools-standalone` | 524.5 | 528.6 | Clones and runs `cat-harness-tools`'s standalone test suite |
| 3 | `cat-harness-tools:skill:register:check` | 154.5 | 151.8 | |
| 4 | `cat-harness-tools:subgraph:jsonld:check` | 73.2 | 70.2 | |
| 5 | `graph:smart-immunizations:import-direction` | 72.9 | 72.7 | |
| 6 | `cat-harness-tools:kind:register:check` | 55.0 | 55.0 | |
| 7 | `cat-harness-tools:check:import-direction` | 51.4 | 54.1 | |
| 8 | `cat-harness-tools:separation:cutover:check` | 48.2 | 49.2 | |
| 9 | `cat-harness-tools:kg:audit:check` | — | 43.8 | (`cat-harness-tools:kg:export:check` 40.5 s on base) |
| 10 | `cat-harness-tools:check:version-bump` | 42.4 | 41.6 | |

Without `#1` (`post-merge:regen:check`'s 1200 s self-recursive timeout in shard 1/4), shard 1/4's remaining gates took **101 s (1m 41s)** and the slowest shard (`shard 3/4`) took **9m 59s** (`≤ 15 min`).

## Done when

- [ ] On uganda#4's shape (index mode, workflow-only change), the
      `Harness PR checks` wall time is measured before and after, and the
      head side's gate time is ≤ 15 min with ≥ 4 shards.
- [x] `gates.json` carries per-gate `seconds`, and the 10 slowest gates of
      the dependency harness are named in this bean (`seconds` per gate and the 10-slowest summary landed in `litlfred/cat-harness-tools#360`, `156d06e`; 10 slowest measured above from `litlfred/smart-immunizations` run `38819372825`).
- [x] A re-pushed PR with an unchanged base shows `base: reused from <key>`
      in the step summary. A PR whose base moved runs the base side.
      A could-not-determine key runs it (`litlfred/cat-harness-tools#362` + `#360` commit `cf4a72a`; verified on `litlfred/smart-immunizations-uganda` run `38807208984` where `base — tests and gates` completed in 10s with `Gates: skipped`).
- [x] `compare` refuses as could-not-determine when a shard's results are
      missing. A test proves it, and none of these changes can produce a
      false green (`cat-harness-tools/.github/scripts/layer-pr-checks/merge-shards.py` + `cat-harness-tools/test/layer-pr-checks-shards.test.ts`, merged in `litlfred/cat-harness-tools#360`).
- [ ] The owner has ruled on the state-branch key question (plan 2).
- [ ] `4rbc`'s wiring into `run-gates.py` is either done or recorded there as
      the next step, with its measured saving.
