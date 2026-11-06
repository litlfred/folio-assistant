---
# folio-assistant-6h4p
$schema: bean/1.0.0
title: 'CI speed II (a): merge-main restarts full CI on every labelled clean PR when main moves'
status: todo
type: task
priority: high
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:26:15Z
updated_at: 2026-11-05T23:28:34Z
parent: folio-assistant-k3vv
---

## Evidence
merge-main (`.github/workflows/merge-main.yml`, from #1820 and #1834) merged main into **every** labelled PR on each push to main, conflicted or not. Each merge is a new head commit, so each PR restarted its full CI: about 130 runner-minutes per PR per push to main.

## Fix
The sweep merges main only into PRs that are actually conflicted. A clean PR keeps its head and its runs; the merge result is tested where it lands (merge-guard, merge_group). PR from the analysis session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

## Done when
- [ ] the sweep's PR is merged
- [ ] one push to main is observed not to restart CI on a clean labelled PR (run IDs cited)

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk from the CI-speed analysis of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

_2026-11-05T11:42:47Z_ — Verification attempt (owner card "Next k3vv" option 1): #2947 merged 10:37Z, but **not yet proven**. The one merge-main push run since, 42017912916 (11:18Z, after #2952), printed no pick or skip line: there were no opted-in PRs to look at, so the conflicted-only rule has not met a clean PR yet. Earlier run 41992492765 (08:10Z, before the fix) also had none, so there is no before/after pair yet. The first box stays open until a push to main is seen to skip a labelled clean PR. **Finding:** the bot is no longer the main source of merges from main. Agent sessions merge main into their own branches themselves (#2952 head dfa1a07 and #2950 head 6bcc436, both "Merge remote-tracking branch 'origin/main'"), and each push restarts full CQG (runs 42012637449 and 42012471605, about 30 min each). #2950's merge resolved a real conflict; whether #2952's was needed is not known. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-05T11:47:29Z_ — **Owner ruling (card "Merge main", option 1):** agents merge main into a branch that has a PR only when it conflicts, when the work needs something that just landed, or once just before it merges. Reading main stays frequent. Skill change: litlfred/cat-harness#1042 (branch-freshness). Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-05T14:38:58Z_ — Check-in: still unproven. merge-main push runs since #2947 (42012218063, 42016877441, 42017912916, 42022080188, 42035515935) printed no pick or skip line, so no opted-in PR existed for the conflicted-only rule to judge. The box stays open. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-05T23:28:34Z_ — Still unproven. merge-main push runs 42079318182 (17:55Z) and 42126723318 (23:04Z) printed no pick or skip line, so no PR had opted in for the conflicted-only rule to judge. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.
