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
updated_at: 2026-11-15T18:22:00Z
parent: folio-assistant-rwmf
---

CI-speed analysis of 2026-11-05 by session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf (owner litlfred asked for it). Successor to the archived `cisp` epic (2026-10-15), two of whose children closed without being done (see c1, c2).

The three biggest costs found:

1. **Restarts when main moves.** merge-main merged main into every labelled clean PR on each push to main, so every such PR restarted its full CI, about 130 runner-minutes per PR per push. Child (a).
2. **The red-main cycle.** main was red for about 250 commits (#2781). 14 re-pin trains in a row failed, about 17 % of runner time. Child (b).
3. **Setup duplication inside Code-quality gates.** Child (c), with c1 and c2.

Smaller levers: (d) reuse when only main moved, (e) gates before push, (f) fewer runner requests, (g) the owner decision on GitHub's real merge queue.

Siblings launched by the analysis session work (a) to (f): "CI speed 1" to "CI speed 4". If a sibling files its own bean for the same item, fold one into the other rather than keep both.

## Child status table (2026-11-09 — 13/14 tracked items completed)

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
| `folio-assistant-tv20` | (c2) | Feature Staging still builds its own site (`cis4`, closed undone) | `completed` | `folio-assistant#2953` (`bef2b0b1a6da`, merged `2026-11-08T18:29:09Z`) |
| `folio-assistant-9ml4` | (14) | Cache-first CI: one `cached-step` primitive, derived keys, trust classes, budget, hit-rate report | `completed` | `#2971`, `#2972`, `#2983`, `#2985`, `#2990`, `#3009`, `#3010`, `#3013`, `#3038`, `cat-harness#1050`/`#1052`/`#1057`/`#1088`/`#1122`, `cat-harness-tools#1508`/`#1512`/`#1519`/`#1523`/`#1551`/`#1611`/`#1703`/`#1707`/`#2327` (`1d86c348d885`); determinism audit `42557731048` 6/6 green |
| `folio-assistant-xaa8` | (g) | Owner decision: move the repo under a free GitHub organization for the real merge queue | `todo` | Owner-deferred decision (not agent work) |

*(Additional completed sibling beans under `k3vv`: `9set` (c1), `ohpz` (d), `fn8q` (e — including `cat-tools-5fmc` & `cat-tools-pp9g` completed in `cat-harness-tools#1725` `277c797958ed`), `711q` (j), `akiq`, `asq1`, `yeg4`, `9ml4`. Release-gated CI (`cat-harness#1158`) Phases 1–4 also landed in `cat-harness#1159` `1cfec870`, `cat-harness-tools#1721` `6571d3f4`, `cat-harness-tools#1722` `961b4d93`, `cat-harness-tools#1741` `5c4cd89a`, `folio-assistant#3047` `8915622d`, and 8 layer re-pins, cutting median PR runner-min across `cat-harness-tools` `38.0 -> 1.2`, `folio-assistant` CQG `79.1 -> 5.3`, and `folio-assistant-core` `4.6 -> 1.5`.)*

## Done when
- [x] (a) to (f) are completed or scrapped with a reason *(all 19 agent work items completed, including `folio-assistant-tv20` `#2953` `bef2b0b1a6da`, `cat-tools-pp9g` `#1725` `277c797958ed`, and `folio-assistant-9ml4` `cat-harness-tools#2327` `1d86c348d885`)*
- [ ] (g) has the owner's answer recorded *(`folio-assistant-xaa8`, owner-deferred item g)*

Evidence from earlier work: `0mf0` measured median PR green → merged before and after merge-main (#1820) and found it slower, 2.2 → 5.7 min (p90 38.8 → 92.6). The gain was merging while red, 32 % → 3 %. Any CI-speed claim here should measure that same median.

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk for the analysis session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

_2026-11-08T08:35:00Z_ — Progress update: 12/14 tracked child beans (`6h4p`, `tsh9`, `x35i`, `69lr`, `k2sg`, `hd58`, `ay33`, `pqlh`, `pdsq`, `uldr`, `mbd8`, `vgfp`) are `completed`; only `tv20` (`#2953`, actively managed by Merge Manager) and `xaa8` (owner-deferred item g) remain open.

_2026-11-09T14:20:00Z_ — Progress update (R8-Lane-6): `folio-assistant-tv20` is now `completed` (`litlfred/folio-assistant#2953` merged at `bef2b0b1a6da` on `2026-11-08T18:29:09Z`), `cat-tools-5fmc` and `cat-tools-pp9g` (under `fn8q`) are `completed` (`litlfred/cat-harness-tools#1725` `277c797958ed` on `2026-11-08T17:12:45Z`), and release-gated CI (`litlfred/cat-harness#1158`) Phases 1–4 landed across `cat-harness#1159` (`1cfec870`), `cat-harness-tools#1721` (`6571d3f4`), `cat-harness-tools#1722` (`961b4d93`), `cat-harness-tools#1741` (`5c4cd89a`), `folio-assistant#3047` (`8915622d`), and 8 layer re-pins (cutting median PR runner-minutes: `cat-harness-tools` PR `38.0 -> 1.2`, `folio-assistant` CQG PR `79.1 -> 5.3`, `folio-assistant-core` PR `4.6 -> 1.5`). 13/14 tracked items in the table and Done-when Box 1 (`(a) to (f)`) are completed; epic remains `in-progress` while `folio-assistant-9ml4` (`in-progress`) and `folio-assistant-xaa8` (`todo`, owner-deferred item g) remain open.

_2026-11-10T18:10:00Z_ — Progress update (R10-Lane-1): Published all 4 staged `claude/layers-tmp-*` cache refs (`dth-sc` `0fcabff7...` @ `58a0521e`, `dth-hrh` `bf8f64cd...` @ `2c43251c`, `dth-phc` `42997551...` @ `d881b37d`, `smart-ra` `b08a7d78...` @ `ceb014a8` + `origin/main` `08f1ce9d...` @ `2fc96ae6`) to `refs/cat/layers/<sha256>` and `refs/cat/layers/main`, deleted the 4 temporary branches, checked off all 5 Phase checkboxes on `litlfred/cat-harness#1158`, and closed `litlfred/cat-harness#1158` (`#issuecomment-6774719114`).

_2026-11-15T19:00:00Z_ — Progress update (`lane-43c1`, subagent `43c12887-2733-443d-b8ef-0e369f856d33`):
- **Child completion rollup**: 18 of 20 direct children of `folio-assistant-k3vv` in `beans/defs/` are `completed` (`6h4p`, `69lr`, `711q`, `9set`, `akiq`, `asq1`, `ay33`, `fn8q`, `hd58`, `k2sg`, `mbd8`, `ohpz`, `pdsq`, `pqlh`, `tsh9`, `tv20`, `uldr`, `vgfp`, `x35i`, `yeg4`).
- **`folio-assistant-9ml4` (`Cache-first CI`)**: `determinism-audit.yml` run `42557731048` (`2026-11-09T03:40:56Z` on `main` at `260c7a6e9f7a05ef80b7f1a035974f1b29942f48`) verified **6/6 producers 100% `DETERMINISTIC`** (`qa-working-copy` 12,470 files, `publish-pages` 13,655 files, `smart-pages` 1,452 files, `ig-index` 1,204 files, `kg-export` 4,437 files, `render-bpmn` 326 files), checking off `Done when #1`; [`litlfred/cat-harness-tools#2327`](https://github.com/litlfred/cat-harness-tools/pull/2327) (`aab37e49d68e43de5ee195c2c614c21c0fca97a2`) is open and queued for Merge Manager to retire the legacy `cat-mount-v1-*` Actions cache steps and `caches/lpc-cat-mount.cache.json` (`Done when #4`, part 1).
- **`folio-assistant-xaa8` (`item g`)**: remains `todo` awaiting the owner's decision on moving the repository under a free GitHub organization for the real merge queue (`Done when #2`).

_2026-11-15T18:22:00Z_ — [`litlfred/cat-harness-tools#2327`](https://github.com/litlfred/cat-harness-tools/pull/2327) merged to `main` at `1d86c348d88577054f09e0a8c2af9ae96cc1f5a2` (`2026-11-15T17:57:33Z`), completing `folio-assistant-9ml4`. 19 of 20 direct children of `folio-assistant-k3vv` in `beans/defs/` are now `completed`; only owner-only `folio-assistant-xaa8` (`item g`, deferred until after the MVP functional freeze per owner card `"xaa8 org"` option 1) remains open.
