---
# folio-assistant-l4zi
title: 'POST-IT PANEL: dismissing it has no inverse — no way to get the panel back'
status: completed
type: bug
priority: high
created_at: 2026-09-21T06:20:35Z
updated_at: 2026-09-21T07:18:58Z
parent: folio-assistant-yj32
---

Owner, 2026-09-21, on the deployed preview:

> clicking https://litlfred.github.io/folio-assistant/STAGING/claude-lhs-navbar-harness-folios-cqo9mu/
> on postit display panel, hides it, no place to get it back. see sibling work
> on defaul harness folio with tiles.

## The defect

Clicking the todo/post-it display panel **dismisses it, and nothing brings it
back**. A control that removes something from the page owes a way to restore
it; without one the only recovery is a reload, and a reader who does not know
that concludes the feature is gone.

This is the same shape as `pb04`'s dead edit link and `d1r6`'s discard, stated
the other way round: **an action whose inverse does not exist is not a toggle,
it is a delete with no confirmation.** `deletion-requires-confirmation` applies
to a view the reader is looking at as much as to a file.

## What to check before designing a fix

- `mountTodoBoard` in `docs/assets/js/docs-ui.js` — the toggle, dock/undock,
  Pin and discard controls all live there, and the discard path is `d1r6`'s,
  which DOES have a destination (`fsh-guts`). The panel dismiss may simply be
  missing the counterpart.
- **The owner's pointer**: *"see sibling work on defaul harness folio with
  tiles"* — the default harness folio's tile work is the pattern to follow, so
  restoring the panel probably belongs on a tile rather than on a second
  control of its own. `1le7` owns the tile template; `zsah` owns the board and
  navbar tile set.
- `sidebar-panels.e2e.ts` reproduces the theme's sidebar structure without a
  Jekyll build, and is where a regression test for this can live.

## Done when

- [ ] the panel's dismiss has an inverse that is reachable without a reload
- [ ] the way back is discoverable from the page, not only from documentation
- [ ] keyboard-operable both ways (this instance's declared interaction profile is low-dexterity)
- [ ] a test that fails if dismiss ships without its inverse


## Summary of Changes

**The bug was the LANDING board specifically**, and the distinction is what
the fix turns on. `mountTodoBoard` renders two ways: as a hidden OVERLAY on an
ordinary page, and INLINE as page content where `.fa-landing-board` exists.
Closing set `hidden` in both.

On an overlay that is correct — the board was covering what you were reading,
so closing returns you to the page, and the launcher's Todos tile re-opens it.
On the landing board it removes **a section of the page** and leaves nothing
where it was. The tile still existed, which is why this reads as "no place to
get it back" rather than "broken": a control two clicks deep inside a
collapsed launcher is a place a reader has to already know about.

So the inline board now collapses to a button **in its own position** —
`.fa-sticky-board-reopen`, carrying the count in its accessible name — and
focus follows it. Left alone, focus landed on `<body>`, which tells a reader
nothing and loses the keyboard position entirely.

Same rule `d1r6` follows for a discarded sticky, which goes somewhere with a
way back rather than being deleted: **an action whose inverse is not reachable
is not a toggle.**

**Three e2e tests**, including the one that would fail for a one-way fix: the
round trip, close → reopen → close. And the overlay case asserts the control is
NOT added there, because adding a button to a page the reader returned to
would be litter.

## Done when

- [x] the panel's dismiss has an inverse that is reachable without a reload
- [x] the way back is discoverable from the page, not only from documentation
- [x] keyboard-operable both ways (focus moves to the control that replaced the board)
- [x] a test that fails if dismiss ships without its inverse
