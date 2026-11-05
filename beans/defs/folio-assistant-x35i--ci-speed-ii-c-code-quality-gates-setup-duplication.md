---
# folio-assistant-x35i
$schema: bean/1.0.0
title: 'CI speed II (c): Code-quality gates setup duplication (no bun cache, smart:pages x17, ig-index x10)'
status: in-progress
type: task
priority: high
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:26:16Z
updated_at: 2026-11-05T11:19:01Z
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
