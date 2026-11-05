---
# folio-assistant-fn8q
$schema: bean/1.0.0
title: 'CI speed II (e): gates before push (pre-push, agent hook, tree-keyed record)'
status: todo
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:26:16Z
updated_at: 2026-11-05T08:26:16Z
parent: folio-assistant-k3vv
---

Catch failures before they reach a runner: a pre-push hook, an agent hook, and a record keyed by the tree hash so CI can see the gates already passed on that exact tree. Sibling "CI speed 3", in cat-harness-tools. An agent's record never stands in for the QA verdict; it only lets CI skip a rebuild it will check.

## Done when
- [ ] the pre-push and agent hooks run the fast gates
- [ ] the tree-keyed record is written and read (cat-harness-tools PR cited)

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk from the CI-speed analysis of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

_2026-11-05T12:00:00Z_ — Status check by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk. cat-harness-tools#1487 (head 6583bad) is green on every required check, `mergeable_state: clean`, no review threads; its one comment (H6 timeout flake) is addressed by the included #1488. It waits on the owner's merge. folio-assistant#2954 re-pins tools to 23147a7, which does NOT contain #1487 (no `scripts/git-hooks/claude-pre-push.sh`), so a further re-pin is needed after #1487 merges. folio-assistant#2951 still applies cleanly to main (`.claude/settings.json` unchanged since its base); it stays draft until that re-pin.
