---
# folio-assistant-bbbl
title: 'TWO RULES COLLIDE on a finished sibling bean: 0pes closes on evidence, bean-coordination never resolves a sibling'
status: todo
type: task
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-20T18:05:19Z
parent: folio-assistant-ahvw
---

Found by the goal-review sweep of 2026-09-20 13:45–17:45 UTC (session_017PqeiS4JYySSWGAYLedmus, bean `mgta`, issue #578). An instruction gap: something the instructions said that the sweep could not do as written, said two ways, or did not say.

## Measured
Four beans read as finished in their own bodies and are not `completed`: `7uff` ("Everything on this bean is now done … Ready to resolve once the owner confirms; not resolving unilaterally", 0 of 7 boxes ticked), `t0i3` (its one open box is done in the body at commit 8d1c8f27), `y8as` (both halves merged, platform copy sha256-verified and deleted), `d1r6` (a full `## Implemented` section, 0 of 5 ticked). `0pes` ("a bean closes on evidence, not on authorship") completed in this window; bean-coordination says never resolve a sibling's bean.

## The gap
The two rules point opposite ways on exactly this case, and each session resolves it by leaving the bean open. The cost is a session of confusion per bean, measured on the four above.

## Done when
- [ ] One sentence in bean-coordination says who closes an evidence-complete bean that another session opened, and what the closer must quote
- [ ] The four beans above are closed by whoever that sentence names
