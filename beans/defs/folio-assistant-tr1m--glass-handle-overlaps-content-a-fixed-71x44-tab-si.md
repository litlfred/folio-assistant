---
# folio-assistant-tr1m
title: 'GLASS HANDLE OVERLAPS CONTENT: a fixed 71x44 tab sits on the top of every page''s content column'
status: todo
type: bug
priority: normal
created_at: 2026-09-22T07:00:07Z
updated_at: 2026-09-22T07:00:07Z
parent: folio-assistant-6lb8
---

Found 2026-09-22 when CI went red on a test that had passed locally an hour
earlier: `funp` landed while the branch was mid-merge, and the first thing
the glass met was the unverified-translation notice.

## The measurement

`.fa-glass-handle` is `position: fixed; top: 0; left: 50%;
transform: translateX(-50%)`, measured at **71 x 44 px** at the top centre of
the viewport. It is on EVERY page as of `funp` — that is the point of stage
1, and it is right.

The unverified-translation notice is inserted as the FIRST CHILD of
`.main-content` (`docs-ui.js`, `mountTranslationBadges`). Measured in the
`translation-badges` fixture: the summary sits at y 14.75, height 24,
spanning the full column. The two boxes intersect.

    summary   x 21    y 14.75   1238 x 24
    handle    x 604   y 0         71 x 44
    overlap   71 px of 1238 — 5.7% of the line, at its centre

## What it costs, and what it does not

A READER IS NOT BLOCKED. 71 px of a full-width line is a dead spot, not a
dead control: a click anywhere else on the line opens the notice, and the
keyboard path is unaffected and separately tested.

A CENTRE-POINT CLICK IS. Playwright clicks an element's centre, which is
exactly where the handle is, so the test timed out for three minutes against
a control a person would have opened first try. The test now clicks
off-centre with the measurement in its comment, and a sibling test asserts
the overlap stays under a tenth of the line — so if the glass grows, the
off-centre click stops being honest and something fails.

## The question this leaves, which is the owner's

Fixed chrome over content is a layout decision, not a bug to patch quietly.
Three answers and they are not equivalent:

1. **Accept it.** A small tab at the top edge is the pull-down metaphor, and
   scrolling moves any other content out from under it. Only content pinned
   at the very top is permanently affected.
2. **Reserve the space.** Add the handle's height as top padding wherever
   the glass exists, so nothing is ever under it. Costs 44 px on every page.
3. **Move the handle** off the content column — a corner rather than the
   centre. Changes the metaphor the owner asked for ("pull down your folio"),
   so this is the one to ask about rather than assume.

Not decided here, deliberately: `funp` is a day old and this is its design,
not a defect in it.

## Done when

- [ ] the owner picks one of the three, or names a fourth
- [ ] whichever it is, the `translation-badges` off-centre click and its
      overlap guard are revisited — they encode today's answer
