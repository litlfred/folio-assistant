---
# folio-assistant-4tnt
$schema: bean/1.0.0
title: 'folio-test main lags the pipeline: the dogfood folio does not exercise what folio_init writes today'
status: todo
type: bug
priority: normal
created_at: 2026-10-04T15:10:09Z
updated_at: 2026-10-10T16:31:50Z
parent: folio-assistant-vuip
---

Recorded from the qou work-plan analysis, 2026-10-04 (session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91). Not started: recorded so the gap has an owner. litlfred/folio-test was stood up by 58h0 as the folio_init dogfood; its main is behind the current template and pipeline, so it no longer proves what it was made to prove. Re-measure the delta before acting.


Re-parented 2026-10-04 from folio-assistant-3p7c (completed) to its parent folio-assistant-vuip: check:bean-rollup refuses an open child under a completed container. The lag is GOAL-1 work, which vuip is.

## Owner ruling (2026-10-10, drain session ml9h)

**Rebuild.** Re-measure folio-test's delta against current folio_init, then re-scaffold it from the current template.

## Done when
- [ ] the delta between litlfred/folio-test main and a fresh folio_init output is measured and recorded here
- [ ] folio-test is re-scaffolded from the current template (PR on litlfred/folio-test)
- [ ] its CI runs the current pipeline green
