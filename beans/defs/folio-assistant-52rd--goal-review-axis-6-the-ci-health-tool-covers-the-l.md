---
# folio-assistant-52rd
title: 'goal-review axis 6: the CI-health tool covers the last 100 runs, which can be shorter than the review window'
status: todo
type: task
priority: normal
created_at: 2026-09-24T12:20:12Z
updated_at: 2026-09-24T12:20:12Z
parent: folio-assistant-ahvw
---

Found 2026-09-24 in a 1-day goal review. The rule concerned is `goal-review` §"The six axes", axis 6 ("Runs in the window by workflow and outcome"), and rule 1 ("Could not determine is never rendered as clean").

**Measured:** `bun run check:ci-health` reported "100 recent run(s) spanning 13.4h" for a 24h window, plus 12.9h of Pages deployments. The first ~10.6h of the window had no CI verdict at all. The tool states its span honestly, but the skill tells the reader neither to compare that span with the window nor what to do when it is shorter. The easy reading, "main is green", covers only the last 13.4h.

## Done when
- [ ] axis 6 says to compare the tool's reported span with the window, and to report the uncovered part as *could not determine*
- [ ] it names the way to reach the rest (the forge's workflow-run listing, paged by `created`), or `check:ci-health` takes a `--since`
