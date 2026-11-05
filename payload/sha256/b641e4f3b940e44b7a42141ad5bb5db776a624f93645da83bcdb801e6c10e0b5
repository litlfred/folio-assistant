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
updated_at: 2026-11-05T08:26:15Z
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
