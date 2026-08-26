---
# folio-assistant-bcnl
title: Decide whether workflow state gates the capability tools, and where
status: todo
type: task
created_at: 2026-08-26T15:29:15Z
updated_at: 2026-08-26T15:29:15Z
---

The decision docs/proposals/workflow-orchestration.md §4 asks for. Phase 1 is advisory: an agent can ignore workflow_next and call content_validate directly, which is the same shape as bean 5rfy (29 of 32 workflows never fire on their own). Options: gate each capability tool on instance state; or gate once at the commit boundary via a hook/CI check that refuses a corpus write whose block has no instance recording that findings were surfaced. The proposal recommends the commit boundary — one place rather than twenty-five, and enforced by something other than an agent's intention to call it. Costs to weigh: it can block a one-line typo fix; partial coverage buys the appearance of a gate; and it needs an activity->tool mapping that does not drift.
