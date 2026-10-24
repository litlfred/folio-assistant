---
# folio-assistant-jwg8
$schema: bean/1.0.0
title: 'CI: stop the line while a post-merge check is red on main'
status: completed
type: task
priority: normal
parent: folio-assistant-ksek
created_at: 2026-10-23T08:43:03Z
updated_at: 2026-10-24T08:55:00Z
---
Rule: while a post-merge check (Post-merge regen check and repair, the Docs-site Liquid check, or any push-to-main workflow) is red on folio-assistant main, only the PR that fixes it merges. Nothing else lands on a red main, because every merge onto red hides the next regression and emails the owner another failure. RELAXATION, owner, 2026-10-23: for the 2026-10-23 window only, any green PR may merge while main is red, because post-merge-regen.yml was red for its own environment (see the epic) rather than for main. The relaxation ends with that window; afterwards the rule applies as written. Done when the rule is enforced (a merge-guard check reading main's post-merge runs) or the owner rules it stays a steward discipline.

_2026-10-24T08:55:00Z_: Closed. The owner chose "A. Close as steward rule" by card at 08:54Z. No merge-guard check gets built, in line with the 2026-10-23 ruling (pwi4 scrapped). The rule stays a steward habit: while a post-merge check is red on main, only the PR that fixes it merges. Session https://claude.ai/code/session_01FABZmtqnNeBaTcHsXrtyK7.
