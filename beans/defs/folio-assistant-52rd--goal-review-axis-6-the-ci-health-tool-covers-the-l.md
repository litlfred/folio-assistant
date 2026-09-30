---
# folio-assistant-52rd
title: 'goal-review axis 6: the CI-health tool covers the last 100 runs, which can be shorter than the review window'
status: completed
type: task
priority: normal
created_at: 2026-09-24T12:20:12Z
updated_at: 2026-09-30T00:27:10Z
parent: folio-assistant-ahvw
---

Found 2026-09-24 in a 1-day goal review. The rule concerned is `goal-review` §"The six axes", axis 6 ("Runs in the window by workflow and outcome"), and rule 1 ("Could not determine is never rendered as clean").

**Measured:** `bun run check:ci-health` reported "100 recent run(s) spanning 13.4h" for a 24h window, plus 12.9h of Pages deployments. The first ~10.6h of the window had no CI verdict at all. The tool states its span honestly, but the skill tells the reader neither to compare that span with the window nor what to do when it is shorter. The easy reading, "main is green", covers only the last 13.4h.

## Done when
- [x] axis 6 says to compare the tool's reported span with the window, and to report the uncovered part as *could not determine*
- [x] it names the way to reach the rest (the forge's workflow-run listing, paged by `created`), or `check:ci-health` takes a `--since`

## Summary of Changes

Amended `cat-harness/skills/folio-core/goal-review.md` (and `.claude/commands/goal-review.md` for tjj6) on branch claude/magical-archimedes-4qkfxp-goal-review-gaps; every done-when box addressed in the skill text.
