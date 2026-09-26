---
# folio-assistant-o0td
title: Post a branch-start comment to the issue and claim beans
status: completed
type: task
priority: normal
created_at: 2026-09-18T16:15:27Z
updated_at: 2026-09-18T16:37:29Z
---

From #203 comment 5731572165 (2026-09-18 14:36).

> "when an human/coding agent starts a new feature branch for an issue, it
> should post a comment back to the issue for visibility, update beans for
> state management."

Currently agents post ROUND SUMMARIES after work lands; nothing announces a
branch at its start, so a sibling session or a human cannot see work has
begun until it finishes.

NOT FOLLOWED on `claude/festive-galileo-s7ibx0` for PR #246 — the rule was
posted after that branch started, but the gap is real and this bean is where
it is recorded.

Belongs in AGENTS.md § Feature requests and CRDM, and as an activity in the
CRDM BPMN's agent lane between `A_LinkIssue` and `A_Implement`.
