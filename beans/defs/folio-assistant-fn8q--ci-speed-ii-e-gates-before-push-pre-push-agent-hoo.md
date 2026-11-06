---
# folio-assistant-fn8q
$schema: bean/1.0.0
title: 'CI speed II (e): gates before push (pre-push, agent hook, tree-keyed record)'
status: completed
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:26:16Z
updated_at: 2026-11-06T07:49:12Z
parent: folio-assistant-k3vv
---

Catch failures before they reach a runner: a pre-push hook, an agent hook, and a record keyed by the tree hash so CI can see the gates already passed on that exact tree. Sibling "CI speed 3", in cat-harness-tools. An agent's record never stands in for the QA verdict; it only lets CI skip a rebuild it will check.

## Done when
- [x] the pre-push and agent hooks run the fast gates — the hook is litlfred/cat-harness-tools#1487 (c1c1d53), pinned on main via #2954; the agent hook is folio-assistant#2951 (35d5b4e)
- [x] ~~the tree-keyed record is written and read~~ — dropped by owner ruling 2026-11-06 (card "Turn on?", option 4: never); the unused record path is being removed

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk from the CI-speed analysis of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

_2026-11-05T12:00:00Z_ — Status check by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk. cat-harness-tools#1487 (head 6583bad) is green on every required check, `mergeable_state: clean`, no review threads; its one comment (H6 timeout flake) is addressed by the included #1488. It waits on the owner's merge. folio-assistant#2954 re-pins tools to 23147a7, which does NOT contain #1487 (no `scripts/git-hooks/claude-pre-push.sh`), so a further re-pin is needed after #1487 merges. folio-assistant#2951 still applies cleanly to main (`.claude/settings.json` unchanged since its base); it stays draft until that re-pin.

_2026-11-05T11:59:58Z_ — litlfred/cat-harness-tools#1487 merged as c1c1d539 (owner asked to merge, 2026-11-05). Next: a folio-assistant re-pin of cat-harness-tools to c1c1d539 or later (the next train, or after #2954), then folio-assistant#2951 comes out of draft. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-05T14:38:58Z_ — Check-in: main still pins cat-harness-tools c807dc9, which predates #1487. folio-assistant#2954 pins 35898db, 17 commits after c1c1d539, so it carries the hook. When #2954 lands, take #2951 out of draft. That is also on hold until the merge steward posts "landed: #2954". Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-05T23:28:34Z_ — folio-assistant#2954 landed (04cf7ef). Main now pins cat-harness-tools 55b1925, which is 190 commits past #1487 and has scripts/git-hooks/claude-pre-push.sh, so #2951's guard now lets the hook run. #2951 is out of draft, and main was merged into it at ee39971 (23:04Z). CI was running when checked: 17 green, 0 red. It merges once green, with the owner's approval. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-06T04:51:52Z_ — folio-assistant#2951 merged (35d5b4e, 2026-11-06T04:48Z), so agents now run the fast gates before `git push`. The first box is ticked. The second box is partly met: CI reading the tree-keyed record is folio-assistant#2957 (merged), but it is **off by default**. The box stays open until it is switched on, or the owner decides it stays off. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-06T04:59:28Z_ — **Owner ruling (litlfred, card "Record on", option 1):** switch the local gate record on, in this order:
1. merge the re-check sweep folio-assistant#2958 once it is green;
2. litlfred then sets the repository variable `CQG_HONOUR_LOCAL_RECORDS=true`.

The switch is a repository variable, not a file, so a PR cannot turn skipping on for its own run, and clearing it turns skipping off at once. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-06T05:46:09Z_ — The re-check sweep litlfred/folio-assistant#2958 merged (3f2aeaa; owner card "Record on", option 1). Step 1 of the ruling is done. Step 2 is for litlfred: set the repository variable `CQG_HONOUR_LOCAL_RECORDS=true`. The second box closes once a PR run shows a step skipped on a local record, with the sweep re-verifying it. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-06T05:58:28Z_ — **Owner ruling (litlfred, cards "Turn on?" and "Unused code"):** CI will **never** honour agents' local gate records. As built, honouring re-runs every skipped run, so each PR costs about two full runs (#2958's own text). Keep the pre-push hook: it stops red runs before they start. Remove the unused parts: the hook's note-writing (cat-harness-tools), #2957's `cqg_judge.py local-record` and `covered` paths, #2958's sweep step and its `statuses: write` / `issues: write`, and the `CQG_HONOUR_LOCAL_RECORDS` switch. Open as PRs; they merge after the owner says yes. Correction to an earlier note: the repository setting did NOT stop a PR enabling skips for itself, because a PR runs its own copy of the workflow code. Its real value was only the instant off switch. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-06T06:08:19Z_ — Removal PRs for the 05:58 ruling are open, ready for review, not merged: litlfred/cat-harness-tools#1572 (https://github.com/litlfred/cat-harness-tools/pull/1572) removes the hook's `refs/notes/cat-gates` note and also its Class B `refs/cat-gates/local/` verdict refs, which only the cqg judge was to read, plus the `cat-gates-notes` cache node. It keeps the gates, the new-failure refusal, the local tree record, and `CAT_GATES_BYPASS` logging. litlfred/folio-assistant#2989 (https://github.com/litlfred/folio-assistant/pull/2989) reverts exactly what #2957 and #2958 added, including `statuses: write` on the six judged jobs and the `issues`/`statuses` write in `sweeps.yml` (no other sweep needs them). It keeps #2951's hook and `reuse-check`. Workflow tests: 314 pass. check:workflows, workflow-injection and workflow-paths pass. Once #2989 merges, litlfred can delete the `CQG_HONOUR_LOCAL_RECORDS` repository variable. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-06T07:47:45Z_ — The unused local-record path is removed, owner approved (card "Merge both?"): litlfred/folio-assistant#2989 merged as acadc5d (no record reading, no re-check sweep, no extra statuses/issues permissions, no `CQG_HONOUR_LOCAL_RECORDS`), and litlfred/cat-harness-tools#1572 merged as e7dc68c (the hook writes no notes or verdict refs). The pre-push gate hook and the agent hook stay. Both boxes are resolved. The note writing stops once folio-assistant re-pins cat-harness-tools past e7dc68c. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.
