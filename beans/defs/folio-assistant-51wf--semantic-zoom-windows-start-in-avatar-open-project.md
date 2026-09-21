---
# folio-assistant-51wf
title: 'SEMANTIC ZOOM + WINDOWS: start in avatar, open projects a window, z-order with raise-on-select'
status: todo
type: task
priority: high
created_at: 2026-09-20T21:46:31Z
updated_at: 2026-09-20T21:46:31Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — R2 + R9 + R15. Unit 4 of 10.

**Two mechanisms that must not be conflated**, which is the whole finding here:

| | trigger | who |
|---|---|---|
| **semantic zoom** | the card's RENDERED width crosses a declared threshold | automatic |
| **open / close** | `[x]`, or opening a card | a person |

`schemas/semantic-zoom.ts` declares the first (folio default, per-kind override,
`because` required on every override, and `zoomThresholdFor` returns the SOURCE so
an inherited number stays traceable). The second is new.

**The owner's ruling, 2026-09-20:** *"start everything in avatar"*, `[x]` closes to
the avatar, and — on which mechanism wins —

> open is like window, avatar/tiles project open panels onto window. sum
> functionality, need to handle z-order.. selecting any part raises

So an open card is a **window**, not a zoom state: it is projected ON TO the board
rather than being the card grown large. An explicit open therefore survives zooming
out, and the board needs a stacking order with **raise-on-select**.

**One question left open, with a stated default:** is z-order PERSISTED in the DI
layer or session-only? `board-positions.ts` deliberately carries no `z` — *"stacking
order is a rendering decision the board makes from the document"*. Default taken:
**session-only**, derived from the raise sequence, because a committed z per note
would make every raise a file write and every two sessions a conflict. Cheap to
reverse: it is one optional field in the DI document.

## Done when

- [ ] every card starts as its avatar, at any size
- [ ] opening projects a window; `[x]` closes back to the avatar
- [ ] an open window survives a zoom-out past the threshold
- [ ] selecting any part of a window raises it
- [ ] zoom falsified in BOTH directions — a test that only checks the shrunk case passes for a board that is always avatars
- [ ] a kind with no avatar takes `GENERIC` rather than rendering blank
