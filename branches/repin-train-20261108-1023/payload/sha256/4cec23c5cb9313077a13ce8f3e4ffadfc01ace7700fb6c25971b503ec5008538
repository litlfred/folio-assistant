---
# folio-assistant-k3vv
$schema: bean/1.0.0
title: 'CI speed II (2026-11-05): restarts on main moves, red-main cycle, setup duplication'
status: in-progress
type: epic
priority: high
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:25:48Z
updated_at: 2026-11-08T08:35:00Z
parent: folio-assistant-rwmf
---

CI-speed analysis of 2026-11-05 by session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf (owner litlfred asked for it). Successor to the archived `cisp` epic (2026-10-15), two of whose children closed without being done (see c1, c2).

The three biggest costs found:

1. **Restarts when main moves.** merge-main merged main into every labelled clean PR on each push to main, so every such PR restarted its full CI, about 130 runner-minutes per PR per push. Child (a).
2. **The red-main cycle.** main was red for about 250 commits (#2781). 14 re-pin trains in a row failed, about 17 % of runner time. Child (b).
3. **Setup duplication inside Code-quality gates.** Child (c), with c1 and c2.

Smaller levers: (d) reuse when only main moved, (e) gates before push, (f) fewer runner requests, (g) the owner decision on GitHub's real merge queue.

Siblings launched by the analysis session work (a) to (f): "CI speed 1" to "CI speed 4". If a sibling files its own bean for the same item, fold one into the other rather than keep both.

## Child status table (2026-11-08 — 12/14 tracked items completed)

| Bean | Item | Title | Status | Evidence / Notes |
|---|---|---|---|---|
| `folio-assistant-6h4p` | (a) | `merge-main` restarts full CI on every labelled clean PR when `main` moves | `completed` | Pick-ONE FIFO (`#2947`) + merge train (`hd58`, `#2956`) landed |
| `folio-assistant-tsh9` | (b) | Red-main cycle from a layer rename; two-phase move rule | `completed` | `cat-harness#1067`, `cat-harness-tools#1528`, `folio-assistant#2985` |
| `folio-assistant-x35i` | (c) | Code-quality gates setup duplication (no bun cache, `smart:pages` x17, `ig-index` x10) | `completed` | `#2950`, `#2968`, `#3010`, `cat-harness-tools#1494`, `#1576` |
| `folio-assistant-69lr` | (c3) | Publish-time QA witnesses stamp the commit, so `main` never reuses a PR's pages | `completed` | `reviewed_tree` + `tree-commits.json` (`#2988`, `#3009`, `#3010`, `#2985`); verified in `docs-site` runs `42412126699` & `42455857544` |
| `folio-assistant-k2sg` | (f) | Fewer runner requests (schedules, writer-records, watchdog churn) | `completed` | `#2951`, `#2960` landed |
| `folio-assistant-hd58` | (h) | Merge train — batch opted-in PRs, CI once, bisect on red | `completed` | `#2956` (`a53bd05`) + `cat-harness#1037` landed |
| `folio-assistant-ay33` | image | CI image: prepared container image replaces per-job setup | `completed` | `#2952` (`7ff048f`) + `#3020` (`9186ef2`) landed |
| `folio-assistant-pqlh` | train-1 | Re-pin trains: keep bootstrap checklists in step with the train's bootstrap pin | `completed` | `cat-harness#1067`, `cat-harness-tools#1528`, `folio-assistant#2985` |
| `folio-assistant-pdsq` | train-3 | Re-pin trains: fix the 3 standing blockers (owner 2026-11-06) | `completed` | All 3 standing blockers resolved (`#2985` merged) |
| `folio-assistant-uldr` | rules | Replace hand-listed `state:visualizer` (53) and `glossary:page` (36) `builtAtPublish` entries with rules | `completed` | `cat-harness#1087`, `cat-harness-tools#1562`, `smart-base#313`, `folio-assistant#2985` |
| `folio-assistant-mbd8` | (c-sub) | Cut `node-kind-index.ts` → `src/auth/gateway.ts` static import | `completed` | `cat-harness-tools#1494` (`bd30779`), re-pinned in `#2985` |
| `folio-assistant-vgfp` | (c-sub) | Derived imports closures: resolve computed-import verdicts at fingerprint time | `completed` | `cat-harness-tools#1576` (`de0ec7a`), re-pinned in `#2985` |
| `folio-assistant-tv20` | (c2) | Feature Staging still builds its own site (`cis4`, closed undone) | `in-progress` | Open PR `folio-assistant#2953` actively managed by Merge Manager |
| `folio-assistant-xaa8` | (g) | Owner decision: move the repo under a free GitHub organization for the real merge queue | `todo` | Owner-deferred decision (not agent work) |

*(Additional completed sibling beans under `k3vv`: `9set` (c1), `ohpz` (d), `fn8q` (e), `711q` (j), `akiq`, `asq1`, `yeg4`; active sibling feature: `9ml4`.)*

## Done when
- [ ] (a) to (f) are completed or scrapped with a reason *(all completed except c2 `folio-assistant-tv20` in `#2953`, actively managed by Merge Manager)*
- [ ] (g) has the owner's answer recorded *(`folio-assistant-xaa8`, owner-deferred item g)*

Evidence from earlier work: `0mf0` measured median PR green → merged before and after merge-main (#1820) and found it slower, 2.2 → 5.7 min (p90 38.8 → 92.6). The gain was merging while red, 32 % → 3 %. Any CI-speed claim here should measure that same median.

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk for the analysis session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

_2026-11-08T08:35:00Z_ — Progress update: 12/14 tracked child beans (`6h4p`, `tsh9`, `x35i`, `69lr`, `k2sg`, `hd58`, `ay33`, `pqlh`, `pdsq`, `uldr`, `mbd8`, `vgfp`) are `completed`; only `tv20` (`#2953`, actively managed by Merge Manager) and `xaa8` (owner-deferred item g) remain open.
