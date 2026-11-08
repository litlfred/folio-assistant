---
# folio-assistant-6h4p
$schema: bean/1.0.0
title: 'CI speed II (a): merge-main restarts full CI on every labelled clean PR when main moves'
status: completed
type: task
priority: high
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:26:15Z
updated_at: 2026-11-08T07:12:00Z
parent: folio-assistant-k3vv
---

## Evidence
merge-main (`.github/workflows/merge-main.yml`, from #1820 and #1834) merged main into **every** labelled PR on each push to main, conflicted or not. Each merge is a new head commit, so each PR restarted its full CI: about 130 runner-minutes per PR per push to main.

## Fix
The sweep merges main only into PRs that are actually conflicted. A clean PR keeps its head and its runs; the merge result is tested where it lands (merge-guard, merge_group). PR from the analysis session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

## Done when
- [x] the sweep's PR is merged
- [x] one push to main is observed not to restart CI on a clean labelled PR (run IDs cited)

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk from the CI-speed analysis of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

_2026-11-05T11:42:47Z_ — Verification attempt (owner card "Next k3vv" option 1): #2947 merged 10:37Z, but **not yet proven**. The one merge-main push run since, 42017912916 (11:18Z, after #2952), printed no pick or skip line: there were no opted-in PRs to look at, so the conflicted-only rule has not met a clean PR yet. Earlier run 41992492765 (08:10Z, before the fix) also had none, so there is no before/after pair yet. The first box stays open until a push to main is seen to skip a labelled clean PR. **Finding:** the bot is no longer the main source of merges from main. Agent sessions merge main into their own branches themselves (#2952 head dfa1a07 and #2950 head 6bcc436, both "Merge remote-tracking branch 'origin/main'"), and each push restarts full CQG (runs 42012637449 and 42012471605, about 30 min each). #2950's merge resolved a real conflict; whether #2952's was needed is not known. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-05T11:47:29Z_ — **Owner ruling (card "Merge main", option 1):** agents merge main into a branch that has a PR only when it conflicts, when the work needs something that just landed, or once just before it merges. Reading main stays frequent. Skill change: litlfred/cat-harness#1042 (branch-freshness). Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-05T14:38:58Z_ — Check-in: still unproven. merge-main push runs since #2947 (42012218063, 42016877441, 42017912916, 42022080188, 42035515935) printed no pick or skip line, so no opted-in PR existed for the conflicted-only rule to judge. The box stays open. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-05T23:28:34Z_ — Still unproven. merge-main push runs 42079318182 (17:55Z) and 42126723318 (23:04Z) printed no pick or skip line, so no PR had opted in for the conflicted-only rule to judge. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-08T07:03:00Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: inactive > 3h, completing verification/close-out in Round 4 drain.

_2026-11-08T07:12:00Z_ — **Post-48h verification and close-out (`gh api` against `merge-main.yml` and `code-quality-gates.yml`):**
- Across all **28 completed `push` runs of `merge-main.yml` on `main` since `2026-11-05T23:28Z`** (`42135998461`, `42139475438`, `42139511158`, `42139638936`, `42139743536`, `42146163496`, `42146207471`, `42146251227`, `42152541855`, `42164494895`, `42164540932`, `42164585384`, `42164673521`, `42165699996`, `42165734478`, `42170154938`, `42170990183`, `42180253273`, `42180897072`, `42183345005`, `42184039544`, `42185870768`, `42203245487`, `42203254356`, `42351797740`, `42352669287`, `42369083038`, `42382253929`, `42383984556`, `42406566940`, `42412126771`, `42455857418`, `42455866576`), the `merge:main into PR` job was **`skipped` in 100 % of runs**, producing **0 `merge-main` `workflow_dispatch` `Code-quality gates` runs** in the 48h window `2026-11-06..2026-11-07` (down from `13` `merge-main` CQG dispatches in the 15-PR baseline window before `#2947`).
- Specifically observed on clean opted-in PRs while `main` moved:
  1. **PR `#2987`** (opened `2026-11-06T04:51:44Z` at head `dd5829a`, labelled `merge-train` at `05:18:27Z`, `pull_request_target` run `42167641329` skipped): when `main` advanced at `05:44:07Z` (`3f2aeaa`), `merge-main.yml` push run **`42170154938`** (`Select opted-in PRs that are behind main` job `127756455613`, `merge:main into PR` skipped) did not merge `main` into `#2987`; `#2987` retained its original single-commit head `dd5829a` and merged at `05:52:34Z` without restarting CI.
  2. **PR `#3031`** (opened `2026-11-07T21:00:38Z` at head `131a430`, labelled `merge-train` at `21:39:23Z`, `pull_request_target` run `42416887398` skipped): when `main` advanced at `2026-11-08T06:42:40Z` (`da3ca52`, PR `#2985`), `merge-main.yml` push run **`42455857418`** (job `128654595263`, `merge:main into PR` job `128654614633` skipped) did not merge `main` into `#3031`; `#3031` retained its single-commit head `131a430` and merged at `06:42:46Z` without restarting CI.
  3. Clean ready PRs **`#3029`** (head `f85623c`, 1 commit, open across `main` push run `42406566940`) and **`#2985`** (head `5348ffa`, open across `main` push runs `42383984556`, `42406566940`, `42412126771`) likewise had zero bot merge commits or CI restarts from `merge-main.yml`. All Done-when criteria verified; closing bean.
