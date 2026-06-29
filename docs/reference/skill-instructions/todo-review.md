---
layout: default
title: Todo Review
parent: Skill instructions
---

{: .note }
> Generated from [`src/skills/todo-review.md`](https://github.com/litlfred/folio-assistant/blob/main/src/skills/todo-review.md) — do not edit here.

# Todo Review Skill

> **Disambiguation:**
> - `todo-review` (this file) = triage of **content feedback** stored
>   in `todos/content-todos.ts` (paper-scope; persistent across
>   sessions; surfaced via `/todos` dashboard).
> - `todo-manager` = the agent's **session work-plan** via TodoWrite
>   (in-memory; per-session).
>
> Both can be active in one session: the agent's work-plan
> (`todo-manager`) may include "process N feedback items via
> `todo-review`" as a single task.

## Role

Monitor open feedback across the manuscript. At session start, offer a
structured todo workflow. Provide triage, context-aware selection, and
a feedback cycle until the author is satisfied.

## When to Use This Skill

- **Session start** (automatic): ask if author wants to work on feedback
- User asks: "show todos", "what feedback is pending", "review todos"
- User asks: "what needs attention", "any open items", "work on todos"
- After completing a block of work, to check if related items can be closed

## Feedback Storage

Feedback lives in `folio-assistant/feedback/<paper-dir>/` (**tracked in
git**, committed to main via worktree). Each content block with feedback
has a TypeScript file:

```
folio-assistant/feedback/
  quantum-observable-universe/
    rigid-monoidal-category.ts
    bundle-initial-conditions.ts
    ...
```

Each file exports an array of `FeedbackItem` (extends `TodoItem` with
`author`/`authorEmail`):

```typescript
import type { FeedbackItem } from "../../schemas/types";

export default [
  {
    "id": "todo-mn159z53",
    "summary": "this does not need to be finite in general",
    "comment": "this does not need to be finite in general",
    "status": "open",
    "priority": "medium",
    "origin": "human",
    "assignee": "editor-agent",
    "createdAt": "2026-03-22T02:35:33.543Z"
  }
] satisfies FeedbackItem[];
```

## Session Start: Todo Workflow

When the editor skill enters the session start protocol and open
feedback exists, follow this flow:

### Step 0 — Offer the todo workflow

Present a brief overview and ask:

> **You have N open feedback items** (X critical, Y high, Z medium).
>
> Would you like to work on feedback today?

Options:
- **Yes, let's review feedback** → proceed to Step 1
- **No, I have something else in mind** → exit to normal triage

### Step 1 — Overview and scope selection

Show a quick summary grouped by chapter:

```
## Feedback Overview

| Chapter | Open | Critical/High | Sample |
|---------|------|---------------|--------|
| Ch 1: Quantum Observable Universe | 12 | 3 | "this does not need to be finite" |
| Ch 4: Path Integrals | 4 | 1 | "missing cross-ref to braiding" |
| Ch 11: Experimental Evidence | 6 | 0 | "clarify mass ratio derivation" |
```

Then ask:

> Where would you like to start?

Options (dynamically generated):
- **High priority first** — all critical + high items across paper
- **Ch N: <title>** — one option per chapter that has feedback
- **Show all** — flat list sorted by priority

### Step 2 — Present the selected feedback

Show the filtered items as a table:

```
## Open Feedback — Ch 1 (12 items)

| # | Priority | Block | Summary |
|---|----------|-------|---------|
| 1 | high | bundle-initial-conditions | this does not need to be finite |
| 2 | high | categorical-point | need proposition for quantum gauge field |
| 3 | medium | rigid-monoidal-category | clarify notation convention |
| ... |
```

Ask: **Which item(s) would you like to address?** (pick by number or "all")

### Step 3 — Review and address each item

For each selected feedback item:

1. **Show the feedback** — full comment, author, date, priority
2. **Read the block** — load `content/<paper>/<chapter>/<rootName>.md`
   and `.ts` manifest for context
3. **Propose a fix** — suggest specific edits to the `.md` content
4. **Ask for approval** — show the proposed changes and ask:
   > Does this address the feedback? (yes / revise / skip)
5. **Apply if approved** — edit the file, mark todo as `in_progress`
6. **Iterate if "revise"** — ask what to change, re-propose

### Step 4 — After each item, offer next steps

After completing (or skipping) an item:

> **Done with "this does not need to be finite".**
> What next?

Options (context-aware):
- **Next item on this block** (if more exist)
- **Next item in this section/chapter**
- **Back to overview** — re-show the chapter summary
- **Done for now** — exit todo workflow

### Step 5 — Wrap up

When the author says "done" or all items in scope are addressed:

> **Session feedback summary:**
> - Reviewed: 5 items
> - Addressed: 3 (edits applied)
> - Skipped: 2
> - Remaining open: 9
>
> The addressed items are marked `in_progress`. You can resolve them
> from the viewer feedback panel when you're satisfied with the changes.

## Resolving Feedback

**Only the human author** may resolve or remove a FeedbackItem
(see CLAUDE.md §4a). Agents must never set status to `resolved` or
`wontfix`, and must never delete items. Agents *may* set status to
`in_progress` after making edits.

Resolution happens in the viewer's feedback panel (click the status
badge on any feedback item).

## Seeding Feedback

When `folio-assistant/feedback/` is empty or doesn't exist for a paper, the skill can
bootstrap an initial set by scanning for issues:

| Source | How to scan | Priority |
|--------|-------------|----------|
| Content validation errors | `content_validate` MCP tool | high |
| Unresolved `uses[]` refs | Validation output | high |
| Missing `.lean` files for definitions | Check block kind vs siblings | medium |
| Missing `.md` files | Blocks without narrative | medium |
| `sorry` in Lean files | `grep sorry lean/` | medium |

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| `editor` | Session start triage includes feedback check |
| `formalizer` | Creates feedback when sorry bridges need attention |
| `proof-status-tracking` | Feedback tracks formalization gaps |
| `content-validation` | Validation errors seed feedback |
| `scientific-accuracy` | Review comments become feedback |
| `proof-triage` | Lean sorry stubs generate high-priority feedback |
| `content-block-review` | Cross-reference issues become feedback |
