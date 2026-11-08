---
# folio-assistant-x35i
$schema: bean/1.0.0
title: 'CI speed II (c): Code-quality gates setup duplication (no bun cache, smart:pages x17, ig-index x10)'
status: in-progress
type: feature
priority: high
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:26:16Z
updated_at: 2026-11-08T07:03:00Z
parent: folio-assistant-k3vv
---

## Evidence
Code-quality gates repeats its setup in every job:
- no bun install cache;
- `smart:pages` runs 17 times and `ig-index:build` 10 times per run;
- the qa-working-copy → publish-pages chain sits in front of most jobs.

Worked by the sibling "CI speed 1" of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf. The two `cisp` children closed undone are filed under this epic as c1 and c2.

## Done when
- [ ] bun install cached
- [ ] smart:pages and ig-index built once per run and handed to the jobs that read them
- [ ] runner-minutes per Code-quality gates run measured before and after (run IDs cited)

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
