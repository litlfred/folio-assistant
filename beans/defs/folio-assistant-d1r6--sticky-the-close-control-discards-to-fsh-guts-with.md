---
# folio-assistant-d1r6
title: 'STICKY: the close control discards to fsh-guts, with a crumpled-sticky icon'
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T11:08:23Z
updated_at: 2026-09-19T13:25:33Z
parent: folio-assistant-o3xy
---

Owner, 2026-09-19:

> stikies have an [x] to close/restore to panel... that should now be
> replaced with it going into the fsh-guts. icon there should be crumpled
> sticky.

## What changes

`docs-ui.js` currently gives a board sticky two controls: `⇱ Pin` floats it
onto the page, and `×` calls `onDock` to return it to the panel. **The `×`
becomes discard-to-`fsh-guts`**, with a crumpled-sticky icon.

## Why this does not strand the reader

Returning a floating sticky to the panel survives, because the board already
offers it twice. The captured spec in `folio-assistant-h32d` records the
second route in the author's own words: *"while floating, they are greyed out
on sticky panel but can also return the sticky note by clicking disabled."*
So the greyed board entry is a real button that docks it, and removing `×`
from that job costs nothing.

Worth stating because the obvious reading — "the close control is being
removed" — would be a regression, and it is not what happens.

## This AMENDS a sibling's captured requirement

`h32d` is CRDM Phase 1, in-progress, not mine, and it records verbatim:

> Closing a floating sticky returns it to the display panel.
> [x] icon closes an open sticky.

Both are now superseded. **Not editing their bean beyond a pointer** —
requirements capture is theirs and resolving or rewriting a sibling's bean
is not mine to do. This bean is the amendment; `h32d` gets one line saying
where to look.

## Done when

- [ ] the board control discards to `fsh-guts/` and the node lands there
      with `$schema`, `movedFrom` and `movedOn`, like every other node
- [ ] the icon is a crumpled sticky, in both schemes
- [ ] discard is **confirmed**, per the never-delete rule — a sticky is a
      human's own note and one stray click must not eat it
- [ ] docking back from the greyed board entry still works, with a test
- [ ] the accessible name says "discard", not "close": they are now
      different actions and a screen reader must not be told the old one

## Depends on

`folio-assistant-uv09` — the trashcan must not leak into the published KG
before the UI starts writing to it.


---

**Re-parented to `o3xy` (UI & ACCESSIBILITY), 2026-09-19.** It hung off
`t0i3` (the fsh-guts store), which said something true — this is fsh-guts
work — and which `check-bean-parents` correctly refuses: a feature cannot
parent a feature, and the roadmap needs an epic. The relationship is recorded
here because the hierarchy can no longer carry it: **this depends on `t0i3`,
which is where the store and its JSON-LD endpoint live.**


## Implemented

The sticky's `×` is now a crumpled-sticky **discard**. The old job — docking a
floating sticky — survives on the greyed board slot, which is already a real
button, so nothing is stranded.

### What "into the fsh-guts" can mean on a static site

The published `fsh-guts.jsonld` is built from the repository; a page cannot
write to it. So a discard is **per-viewer, in `localStorage`**, and the UI says
so in words wherever a discarded item appears. A reader who thinks they cleared
a todo for the team has been misled by the control, which is a worse failure
than not having it.

**It is restorable**, because that is the rule the crumpled icon stands for:
`fsh-guts` is the trashcan that is KEPT. Discarded stickies are listed under
Settings → Discarded, in their own labelled section, each with Restore.

### Two real bugs the specs found, both the same shape

1. **The control vanished when no `fsh-guts` document was published** — so on
   any folio that has not deployed one, a discard was one-way. A delete
   wearing a crumpled icon.
2. **`buildViews()` runs when the LAUNCHER opens and caches forever**, so a
   reader who opened the launcher, discarded a sticky, then opened Settings
   found no way back until they reloaded. Now repainted on
   `fa:todos-discarded`.

Both are the never-delete rule failing through a mechanism rather than a
decision, which is the way it is most likely to fail again.

### A stale test that passed for the wrong reason

`"closing a pinned sticky returns it to the board"` kept passing against the
new behaviour: it asserted `.fa-sticky-slot").first()` was not floating, and
the discard removes that slot, so `.first()` silently retargeted to the NEXT
todo's slot, which had never floated. Two fixture items was all it took.
Measured 2 slots before, 1 after. Rewritten to assert the COUNT, which is what
would have caught it.
