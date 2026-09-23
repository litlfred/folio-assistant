---
# folio-assistant-tr1m
title: 'GLASS HANDLE OVERLAPS CONTENT: a fixed 71x44 tab sits on the top of every page''s content column'
status: completed
type: bug
priority: normal
created_at: 2026-09-22T07:00:07Z
updated_at: 2026-09-22T09:29:41Z
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

- [x] the owner picks one of the three, or names a fourth
- [x] whichever it is, the `translation-badges` off-centre click and its
      overlap guard are revisited — they encode today's answer

## Resolution — the owner chose ACCEPT, 2026-09-22

Of the three options, option 1. A tab at the top edge IS the pull-down
metaphor, and the measurement is what makes accepting it defensible rather
than merely convenient: 71 px of a 1238 px line, 5.7%, and only content
pinned at the very top of the column is permanently affected — scrolling
moves everything else out from under it.

Not chosen, and worth recording so nobody re-derives them:

- **Reserve the space** would cost 44 px of top padding on every page in the
  repository to fix a 5.7% dead spot on one control.
- **Move the handle** to a corner would trade the metaphor the owner asked
  for against the same 5.7%.

### What changed, and what deliberately did not

No product change. The two tests in `translation-badges.e2e.ts` now say they
encode an ACCEPTED design rather than a workaround pending a decision —
which is the whole of the second done-when. A comment that reads "we click
off-centre because of an unresolved overlap" invites the next agent to
"fix" the overlap and delete the guard.

**The guard stays, and it is what makes accepting safe.** The decision rests
on a NUMBER — 5.7% of one line — not on the overlap being harmless in
principle. A decision resting on a number needs the number checked, or it
quietly becomes a decision about something else the day the glass grows. The
sibling test asserts the boxes DO overlap vertically (the fact, not a wish)
and that the horizontal overlap stays under a tenth of the line.
