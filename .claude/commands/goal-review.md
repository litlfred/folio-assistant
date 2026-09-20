---
description: Cold start, sweep a time window of activity (sessions, beans, issues, PRs, branches, CI), and prioritise it against goals stated in the owner's words.
argument-hint: "[window, e.g. 4h or 1d] [-- goal 1; goal 2; goal 3]   (omit the goals to get the synopsis only)"
allowed-tools: Bash(git*), Bash(bun*), Bash(beans*), Bash(cat-harness/scripts/*), mcp__github__list_pull_requests, mcp__github__search_pull_requests, mcp__github__pull_request_read, mcp__github__list_issues, mcp__github__issue_read, mcp__github__list_commits, mcp__github__actions_list, Agent, AskUserQuestion
---

# /goal-review — what happened, what is stalled, what next for each goal

Runs the [`goal-review`](../../cat-harness/skills/folio-core/goal-review.md)
skill. Read it first; this file only parses the arguments and names the order.

## Arguments

`$ARGUMENTS` — a window, then optionally ` -- ` and the goals separated by `;`.

- Window: a duration (`4h`, `90m`, `1d`) or two instants. **Default: `4h`.**
- Goals: kept **verbatim**; they are the owner's words, not yours. With no
  goals, produce the synopsis and the instruction gaps, and say that no queue
  was built because no goal was given.

## Order

1. Cold start — the line at the top of `AGENTS.md`; fetch every branch; fix
   the window's two edge commits on the default branch.
2. Sweep the six axes (sessions by commit trailer, branches, proposals,
   work plan, issues, CI). Delegate the long reads — one agent per goal for
   the work-plan items, one for the open proposals — and keep the
   conclusions.
3. Classify against each goal; build the queue; record each instruction gap
   as a work item parented to the process epic.
4. Report: synopsis, then one queue per goal, then the gaps, then **one**
   selectable question with a count of the rest.

Do not pick up any queue item in the same turn. The review ends at the
question.
