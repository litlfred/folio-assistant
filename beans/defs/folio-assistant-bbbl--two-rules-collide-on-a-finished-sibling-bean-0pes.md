---
# folio-assistant-bbbl
title: 'TWO RULES COLLIDE on a finished sibling bean: 0pes closes on evidence, bean-coordination never resolves a sibling'
status: completed
type: task
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-20T20:00:00Z
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

---

_2026-09-20T19:00Z_ — **Done-when 1 landed** (PR #589, issue #588). The owner
chose a `ready-to-close` state with the evidence quoted, and the owner confirms
the batch.

`bean-coordination` §"When you cannot re-derive it yourself — `ready-to-close`"
carries the sentence. It is a **tag** rather than a sixth status, and the reason
is mechanical rather than stylistic: `beans update <id> --status ready-to-close`
answers *"invalid status: ready-to-close (must be in-progress, todo, draft,
completed, scrapped)"*, and `BeanStatusSchema` is defined as exactly what that
flag accepts. `bun run check:ready-to-close` lists the queue and fails on a tag
with no `## Evidence` — the parking space the rule forbids.

**The collision's other half was in `AGENTS.md`, not in this bean.** Line 210
said *"never resolve a sibling's bean"*, and `bean-coordination`'s own summary
paragraph said the same, both contradicting §"Closing a bean whose work has
already landed" further down the file they sit in. The skill wins; all three
are corrected.

**Done-when 2 is the owner's.** `7uff`, `t0i3`, `y8as` and `d1r6` are tagged,
each with an `## Evidence` section quoting what was verified and stating what
this session could NOT re-derive. None is closed — that is the rule working, not
the rule stalling.

- [x] One sentence in bean-coordination says who closes an evidence-complete bean that another session opened, and what the closer must quote
- [ ] The four beans above are closed by whoever that sentence names

_2026-09-20T20:00Z_ — **Done-when 2 discharged; this bean is closed.** The owner
confirmed the `ready-to-close` batch, and `7uff`, `t0i3`, `y8as` and `d1r6` are
`completed`, each citing the evidence already in its body. `ready-to-close` was
removed from all four: `check:ready-to-close` reports a tag on a closed bean as
one to take off, so leaving it would have made the queue report a defect on its
own success.

- [x] One sentence in bean-coordination says who closes an evidence-complete bean that another session opened, and what the closer must quote
- [x] The four beans above are closed by whoever that sentence names
