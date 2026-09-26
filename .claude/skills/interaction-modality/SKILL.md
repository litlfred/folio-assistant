---
name: interaction-modality
description: >
  Read BEFORE handing any decision to the person — an AskUserQuestion, an
  end-of-turn "next" line, a PR body or issue comment asking them to choose, or
  a bean's `## Done when`. Covers the six parts a question must contain, the
  five-column comparison that goes in the PROSE rather than in a selection
  tool's labels, marking the recommended option, saying what happens if they
  say nothing, and the rule for when several decisions are open at once.
  Triggers on: ask the user, offer options, which approach, get their call,
  need a decision, present alternatives, trade-offs, recommend, confirm before.
allowed-tools: Read Grep Glob
---

# Asking well — the trigger stub

**This is a pointer. The rule lives in the knowledge graph:**

- [`interaction-modality`](../../../cat-harness/skills/folio-core/interaction-modality.md)
  §4 — the six parts, the form checklist, the ONE-in-full/count-the-rest rule.
- [`decision-comparison`](../../../cat-harness/skills/folio-core/decision-comparison.md)
  — the five columns, and why cost and downstream impact are different things.

Read those before composing the question. **This stub exists because the
canonical files are not offerable to the agent by name**, so an agent looking
for the rule found only `AGENTS.md`'s summary — which is what happened on
2026-09-20, in the session that was implementing this very skill's neighbours.

## The four that get skipped, in the order they get skipped

1. **The comparison goes in the PROSE, before the question.** A selection tool
   shows one option at a time, so trade-offs written into its labels are not a
   comparison — the reader cannot lay the rows against each other. Write the
   table, then offer the selection.
2. **Say what happens if they say nothing**, then do that. Silence must never
   block the work.
3. **Mark the recommended option and put it first.** Someone who does not want
   to decide should be able to take the first thing and be right.
4. **Expand every identifier on first use.** A bean id, a file path, an option
   name you coined an hour ago inside an issue: all opaque to the reader,
   and the coined name is the worst because it *feels* defined to you.

The whole test, checkable in one pass:

> **Can the reader answer without opening anything?**
