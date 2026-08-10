---
# folio-assistant-rpt1
title: Report beans at the top and bottom of every turn
status: in-progress
type: task
created_at: 2026-08-10T02:00:00Z
updated_at: 2026-08-10T02:00:00Z
---

Branch `claude/bean-reporting-directive-2026-08-10`.

`.beans/` is the committed work-plan, but nothing made an agent *say* what it was
working on. In practice that meant durable work happened without a bean at all —
a manifest-parser bug (`mcp1`) was found, fixed, tested and merged before anyone
noticed it had never been claimed, which is precisely what "claim before you
work" exists to prevent.

Two announcements, both required, because they answer different questions:

- **On starting** — the first line of the turn where work on a bean begins:
  which bean, and what is being attempted. This is what a sibling session needs
  in order not to collide, and it is the moment the claim is cheap.
- **At the end of every turn** — which beans were worked and what is next, each
  with enough context to be actionable without opening the file.

The synopsis budget is 50 words, not a headline. A bean name plus five words
tells a reader nothing they could act on; the useful part is *why* it is next
and what would change if it were not.

Goes in `AGENTS.md` (agent-generic, read natively by every tool) rather than a
skill, since it applies to every turn regardless of what is being worked on.
