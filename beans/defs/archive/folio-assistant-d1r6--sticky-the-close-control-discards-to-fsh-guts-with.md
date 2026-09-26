---
# folio-assistant-d1r6
title: 'STICKY: the close control discards to fsh-guts, with a crumpled-sticky icon'
status: completed
type: task
priority: normal
created_at: 2026-09-19T11:08:23Z
updated_at: 2026-09-20T20:00:00Z
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
- [x] the icon is a crumpled sticky, in both schemes
- [ ] discard is **confirmed**, per the never-delete rule — a sticky is a
      human's own note and one stray click must not eat it
- [x] docking back from the greyed board entry still works, with a test
- [x] the accessible name says "discard", not "close": they are now
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

## Evidence

Tagged `ready-to-close` by the `bbbl` sweep, 2026-09-20. **Not closed** — the
owner confirms the batch (`bun run check:ready-to-close`).

**The bean carries a full `## Implemented` section** against 0 of 5 ticked
boxes, which is the `bbbl` shape exactly: the work is described as done and the
checklist was never walked back over.

**Two defects found and fixed during the work**, both recorded: the control
vanished when no `fsh-guts` document was published (*"a delete wearing a
crumpled icon"*), and `buildViews()` cached from launcher-open so a discarded
sticky had no route back until reload — now repainted on `fa:todos-discarded`.
Both are the never-delete rule failing *through a mechanism rather than a
decision*, which is the argument for the fix rather than a description of it.

**A test was found passing for the wrong reason and rewritten** — `"closing a
pinned sticky returns it to the board"` asserted on `.fa-sticky-slot").first()`,
which silently retargeted after the discard removed the slot. Measured 2 slots
before, 1 after; rewritten to assert the count. A session that finds and fixes
a vacuous test is evidence about the work's quality, not just its completion.

**What this session could NOT re-derive**: the Playwright specs were not run
here, and the restore path (Settings → Discarded) was not exercised against a
running viewer.

---

_2026-09-20T20:00Z_ — **CLOSED on the owner's confirmation of the `ready-to-close`
batch, 2026-09-20.** The evidence above is what was confirmed against; nothing
new was measured at closing time, and this note says so rather than implying a
re-derivation that did not happen.

The `ready-to-close` tag is spent and removed: `check:ready-to-close` reports a
tag on a closed bean as one to take off, so leaving it would make the queue
report a defect on its own success.

---

## Audited 2026-09-20 — THREE of five, not five, and not zero

Raised in a session brief as *"implemented with no boxes ticked"*. Half right,
and the half that is wrong matters more than the half that is right: ticking
all five would have closed a bean with two real gaps in it.

**Done, measured against `docs/assets/js/docs-ui.js`:**

- The crumpled icon is live — `CRUMPLED_GLYPH` at :1844, an inline SVG drawn
  with `currentColor`, so it is correct in both schemes by construction rather
  than by a second rule.
- Docking back from the greyed board entry works and is tested —
  *"clicking the greyed slot also returns it"* in `sticky-todos.e2e.ts`, and
  the greyed entry is a REAL button rather than a `disabled` one, which the
  code comments record as deliberate: `disabled` removes it from the tab order.
- The accessible name says discard, not close: *"Discard &lt;summary&gt; to the
  trashcan (restorable, this browser only)"*.

**NOT done, and both are the same gap seen twice:**

- **It does not discard to `fsh-guts/`.** `discardTodo` (:1880) pushes the id
  into `localStorage` under `DISCARDED_TODOS_KEY`. No node is written, so
  nothing lands anywhere with `$schema`, `movedFrom` or `movedOn`. The client's
  own aria-label says so out loud — *"this browser only"* — so this is a known
  limitation stated in the UI rather than a silent one, which is the better
  failure but is still not the requirement.
- **Discard is not CONFIRMED.** `grep -n "confirm(" docs/assets/js/docs-ui.js`
  returns nothing. The bean's own reason stands: *a sticky is a human's own
  note and one stray click must not eat it*, and that is
  `deletion-requires-confirmation` applied to the surface most likely to break
  it.

**The two are one design question, which is why neither shipped.** A discard
that only writes `localStorage` is reversible in this browser and invisible
everywhere else; a discard that writes to `fsh-guts/` is a COMMIT, and a commit
needs both a confirmation and a writable datastore. `harness-instances.md`
names that as an open owner question — *"What is the writable datastore?"*, with
gh-pages static, a local server, and a GitHub write path as three answers with
three security postures. **Until that is answered this bean cannot be
finished**, and the honest status is in-progress with three boxes ticked rather
than completed with five.

Kept `in-progress` rather than blocked: `bean-blocking` says a real block
carries what it waits on, since when, an expiry and a handoff. This waits on an
owner decision that is already recorded elsewhere, so a second blocking record
would be a second answer.
