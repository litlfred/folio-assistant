---
# folio-assistant-4tnt
$schema: bean/1.0.0
title: 'folio-test main lags the pipeline: the dogfood folio does not exercise what folio_init writes today'
status: completed
type: bug
priority: normal
created_at: 2026-10-04T15:10:09Z
updated_at: 2026-10-16T08:14:00Z
parent: folio-assistant-vuip
---

Recorded from the qou work-plan analysis, 2026-10-04 (session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91). Not started: recorded so the gap has an owner. litlfred/folio-test was stood up by 58h0 as the folio_init dogfood; its main is behind the current template and pipeline, so it no longer proves what it was made to prove. Re-measure the delta before acting.


Re-parented 2026-10-04 from folio-assistant-3p7c (completed) to its parent folio-assistant-vuip: check:bean-rollup refuses an open child under a completed container. The lag is GOAL-1 work, which vuip is.

## Owner ruling (2026-10-10, drain session ml9h)

**Rebuild.** Re-measure folio-test's delta against current folio_init, then re-scaffold it from the current template.

## Done when
- [x] the delta between litlfred/folio-test main and a fresh folio_init output is measured and recorded here
- [x] folio-test is re-scaffolded from the current template (PR on litlfred/folio-test)
- [x] its CI runs the current pipeline green

## Progress 2026-10-12 (lane C)
- folio-test#7: re-scaffolded from today's `init-folio`; the delta is recorded in the PR (done-when 1). The euclidean chapter moved from `content/` to `folio/`. The beans, todos and fsh-guts state branches are seeded. The submodule is bumped to folio-assistant main 1ad865e.
- Done-when 3 needs a `qa-sweep` dispatch after the merge, because the template workflows are dispatch-only.

## Progress 2026-10-12 15:3x (lane C)
folio-test#7 is merged (3518d55), so done-when 1 and 2 are met. Done-when 3 waits on the qa-sweep dispatch in folio-test.

## Blocked 2026-10-12 16:06 (lane C): done-when 3 waits on folio-assistant's re-pin
The scaffold's workflows never mounted the platform layers. cat-harness-tools#154 fixes the templates (CI pending), and folio-test#8 applies the fix to folio-test (held; with it, `mount:lock` reports 11 instances OK). folio-assistant's lock still pins tools a9e699ca, which predates `pipeline/qa-sweep.ts`. After the re-pin (#2529, tools ≥ c4efa71): bump folio-test's folio-assistant submodule to that commit, re-dispatch qa-sweep on #8, and merge it when green.

## Completed 2026-10-16
- Bumped `folio-assistant` submodule in `litlfred/folio-test#8` (`fix/mount-layers`) to `c53e48f7b2cf015377b96f2de78f8d5adce6a427` (`9f7f612`).
- Dispatched `QA sweep (all integration watchers)` on `fix/mount-layers` (run `38871748025`), which completed `success`.
- Merged `litlfred/folio-test#8` into `main` (`c12a3dc99228410f7626076071c615d05ca6a657`).
