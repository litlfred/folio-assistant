---
# folio-assistant-pwi4
$schema: bean/1.0.0
title: 'CI: folio-assistant PRs merge only on merge-guard success, no shortcuts'
status: scrapped
type: task
priority: normal
parent: folio-assistant-ksek
created_at: 2026-10-23T08:43:03Z
updated_at: 2026-10-23T16:06:00Z
---
Rule: a folio-assistant PR merges only when the merge-guard commit status on its head is success, through bun run cat merge:guard <pr> --merge (bean uoob). No direct merge PUT, no admin override, no merging while a required workflow is still running, no ready marker signed by another session, and no re-running a red job until it passes without a cause. Merge-guard check 5 (ci) is what makes the PR-time checks of the sibling bean count, so a shortcut around it is a shortcut around them. Done when the owner's ruleset requires the merge-guard context (pinned to the GitHub Actions app) on main, and the rule is in the merge steward's skill.


## 2026-10-23T16:05Z: owner ruling, not wanted

The owner (litlfred) said "i dont want the merge guard check" when asked about requiring the merge-guard context on main. The ruleset step will not be done; merge-guard stays advisory. Scrapped.
