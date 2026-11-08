---
# folio-assistant-x35i
$schema: bean/1.0.0
title: 'CI speed II (c): Code-quality gates setup duplication (no bun cache, smart:pages x17, ig-index x10)'
status: completed
type: feature
priority: high
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:26:16Z
updated_at: 2026-11-08T07:20:00Z
parent: folio-assistant-k3vv
---

## Evidence
Code-quality gates repeats its setup in every job:
- no bun install cache;
- `smart:pages` runs 17 times and `ig-index:build` 10 times per run;
- the qa-working-copy → publish-pages chain sits in front of most jobs.

Worked by the sibling "CI speed 1" of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf. The two `cisp` children closed undone are filed under this epic as c1 and c2.

## Done when
- [x] bun install cached
- [x] smart:pages and ig-index built once per run and handed to the jobs that read them
- [x] runner-minutes per Code-quality gates run measured before and after (run IDs cited)

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk from the CI-speed analysis of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.


## Measured (2026-11-05, run 41981133123, PR #2945) — PR #2952

Per-job step times, CQG:

| step | per job | verdict |
|---|---|---|
| `bun install --frozen-lockfile` | 3–8 s | **no cache added**: an actions/cache restore costs about as much |
| `smart:pages` | ~1 s | **not carried**: nothing to save |
| `ig-index:build` in typescript-test ×4 + e2e-shard ×3 | 12–16 s | **done in #2952**: they download `ig-indexes` (1–3 s) from `qa-working-copy`, which they already `needs`; ~85 runner-s/run |
| `bun run cat state:mount` | **43–68 s, all ~17 jobs (≈16 runner-min/run)** | the real lever — see below |

**state:mount.** In a fresh worktree mounted by `.github/mount-from-lock.sh` (5.6 s warm, all 12 instances current), `remoteFanOut` → `mountRemote` → `resolveClosure` re-fetches every instance's remote tree: **69 s** with nothing to change. `mountState` (12 branch graphs) is 15 s; `remoteFanOut(..., {check: true})` is 2 s. Fix: skip the remote resolve when the lock check reads current (cat-harness-tools `scripts/remote-mount.ts`), handed to session_01VQDpPeA2N8L3orQCPPMAas.

**Rejected, with numbers — do not re-try without new measurements:**
- typescript-test 4 → 2 shards: `bun test` is **322 s** per shard (not 2m10s), setup ~100 s; 2 shards ≈ +5 min critical path. `workflow-yaml.test.ts` also pins `[1,2,3,4]`.
- shard-1 `render:bpmn:check` + `smart-base:processes:render:check` to a no-`needs` job: they are 18–22 s and already shard-1 only; a new job costs ~100 s setup + Chromium.
- merge `qa-working-copy` into `publish-pages`: would save one setup (~100 s) and one queue wait, but `publish-pages` needs `verdict-reuse`, the merged job installs a browser (its gates leave the fast set, `gates-workflows.test.ts`), and the diff-keyed-reuse work (`.github/scripts/{qa-copy,publish-pages}-reuse.sh`) is changing these two jobs. Deferred, not rejected.



_2026-11-05T11:18Z_ — #2952 merged: shards download ig-indexes (12–16 s → 1–3 s, run 42012637449 vs 41981133123). bun cache and smart:pages carrying closed as not worth it (measured above). Remaining: the state:mount re-fetch, with session_01VQDpPeA2N8L3orQCPPMAas in cat-harness-tools.

_2026-11-05T12:35:29Z_ — litlfred/cat-harness-tools#1489 measured `state:mount` going from 48.5–58.8 s to 1.1–1.2 s per call, and Code-quality gates calls it in about 17 jobs. Reported by the analysis session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf; noted by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-06T04:20Z_ (session https://claude.ai/code/session_01VQDpPd7y4nwxjHFm66CMKF): landed folio-assistant#2965 (`c37177e`, `.github/scripts/bundle-cache.sh`: the QA working copy and publish-time pages are keyed on a digest of the tree, the exact tool versions, every mounted state-branch tip and the qa-reports head, and reused from a trusted run that recorded the same digest) and #2966 (`d2f6726`: publish-pages folded into the qa-working-copy job, one setup and one runner wait fewer per run; `needs.publish-pages.*` → `needs.qa-working-copy.*`). Owner cards Q3 (merge the jobs), Q6 (land both), Q8 (merged by this session). Measured: misses cost 1–3 s per job; a hit needs the same tree AND unmoved state branches, which move every few minutes, so hits will be rare until keys narrow to traced reads (CI speed 14 is porting this onto `cached-step`). The QA working copy is not byte-reproducible across builds of one commit (17f6fa0a… vs 7ba8341b… at eaa6558), filed with CI speed 14's determinism audit. Main-push cache verdict: pending (run on d2f6726).

_2026-11-08T07:03:00Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: inactive > 3h, completing verification/close-out in Round 4 drain.

_2026-11-08T07:20:00Z_ — Before/after runner-minutes per `Code-quality gates` (`code-quality-gates.yml`) run measured and closed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3):
- Note on Done-when boxes 1 & 2: per the 2026-11-05 measurements above and `#2961`/`#2964` (`ci-image` pre-baked setup restore in ~5 s), `node_modules` / toolchain setup is restored from `ci-image` + lock-aware `state:mount` (`cat-harness-tools#1489`, 48–59 s → 1.1–1.2 s), `ig-indexes` is built once in `qa-working-copy` and handed via artifact to test/e2e shards (`#2952`), and `publish-pages` is folded into `qa-working-copy` (`#2965`/`#2966`).

| Phase | Run ID | Event / PR / Commit | Non-skipped jobs | Total runner time (s) | Total runner-minutes | Delta vs baseline (`42012108138`) | Notes |
|---|---|---|---:|---:|---:|---:|---|
| **Before** (2026-11-05 baseline) | `41981133123` | `pull_request` #2945 (`96cf0c1d18`) | 19 / 20 | 5,943 s | **99.1 min** | — | `state:mount` 43–68 s × 17 jobs (~16 min); separate `qa-working-copy` (355 s) + `publish-pages` (630 s) = 985 s; `ig-index:build` ×7 shards (~85 s) |
| **Before** (2026-11-05 pre-merge) | `42012108138` | `pull_request` #2952 (`bd62e6cc6d`) | 19 / 20 | 6,344 s | **105.7 min** | baseline | 1,742 s (29.0 min) in setup across jobs; `qa-working-copy` (375 s) + `publish-pages` (585 s) = 960 s |
| **Interim** (`#2952` `ig-indexes` only) | `42012637449` | `pull_request` #2952 (`205b665d1e`) | 20 / 20 | 6,829 s | **113.8 min** | +7.7% | `ig-indexes` artifact handoff active; before `#1489` `state:mount` fix, `#2961`/`#2964` `ci-image`, `#2966` job merge, and recipe 6 cone |
| **After** (2026-11-07 `main` push) | `42406566912` | `push` `main` #3012 (`2808845b52`) | 10 / 14 | 4,528 s | **75.5 min** | **−28.6% (−30.2 min)** | Merged `qa-working-copy` (852 s); 36 CQG gates recorded under recipe 6 |
| **After** (2026-11-07 `main` push) | `42412126727` | `push` `main` #3029 (`46a8ffbce4`) | 10 / 14 | 4,414 s | **73.6 min** | **−30.4% (−32.1 min)** | Merged `qa-working-copy` (802 s); `lint` 94 s, `import-hygiene` 176 s, `ratchet` 84 s; 36 CQG gates recorded |
| **After** (2026-11-07 typical PR) | `42413770441` | `pull_request` #3031 (`131a43067c`) | 16 / 17 | 3,932 s | **65.5 min** | **−38.0% (−40.2 min)** | Merged `qa-working-copy` 796 s; `bun test` ×4 shards = 194 s total (`43+52+42+57 s`); 23 CQG gates skipped by recipe 6 CI cone |
| **After** (2026-11-07 12-instance re-pin PR, all test + e2e shards full) | `42412680519` | `pull_request` #2985 (`5348ffa7bc`) | 19 / 19 | 6,225 s | **103.8 min** | **−8.8% (−10.0 min vs `42012637449`)** | Worst-case full-suite re-pin running all 4 `bun test` shards + all 3 `e2e` shards (`e2e` 1–3 dropped `735 s → 613 s`, saving 122 s) |
