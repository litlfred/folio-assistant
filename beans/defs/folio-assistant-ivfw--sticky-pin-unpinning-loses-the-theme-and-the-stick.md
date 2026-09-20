---
# folio-assistant-ivfw
title: 'STICKY PIN: unpinning loses the theme and the sticky cannot be moved — it should stay visible and movable on the board'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-20T15:09:58Z
updated_at: 2026-09-20T18:39:46Z
parent: folio-assistant-o3xy
---

**Tracked as [#558](https://github.com/litlfred/folio-assistant/issues/558)**, and the
link is recorded HERE because it was one-way: the issue names this bean, this bean
named nothing. A one-way link is worse than none between an issue and a bean,
because the half that has it reads as complete — an agent arriving at the bean
cannot tell whether an issue exists, and opens a second.

Owner, 2026-09-20, verbatim:

> when you unpin, sticky, it loses its theme and you cant move around dispaly.
> treate it as visible to move in fixed place around miro build like folio
> visualtion.

## Two defects in one gesture

1. **Unpinning LOSES THE THEME.** A pinned sticky renders with its backdrop
   art; unpinned it comes back as a flat card. The theme is a property of the
   sticky, not of the pinned state, so losing it on unpin means the pin button
   silently changes what the note IS.
2. **An unpinned sticky cannot be MOVED.** It has nowhere to go and no way to
   go there.

## What it should be instead

> treat it as visible to move in fixed place around miro build

So unpinned is not "hidden" or "returned to a list" — it stays **visible**,
keeps its theme, and becomes **movable**, positioned on the board the way a
note on a Miro board is. The board is the fixed frame; the sticky moves within
it. That is the same model `6lb8` describes for the folio/Miro board, so this
is not a new surface — it is the pin gesture finally agreeing with the board
it sits on.

## Where it is

`mountTodoBoard` in `docs/assets/js/docs-ui.js` (the Pin control is built
around line 1959, `"⇱ Pin"`, with the rationale for it being a BUTTON rather
than a drag at line 2006: *"So the gesture is a BUTTON: Pin lifts the sticky
onto the page, Close ..."*). **Read that comment before changing this** — the
button was a deliberate choice over a drag gesture, and "movable" must not
quietly discard the accessibility reasoning recorded there. Movable in a fixed
frame can still be keyboard-driven; a drag-only affordance would be a
regression this repository has already argued itself out of once.

An inline sticky *already* carries no Pin and no Close (line 1951) because it
sits beside the content it is about — so whatever lands here must keep that
case working, and there is an e2e test pinning it: *"an inline sticky carries
no Pin and no Close"*.

## Depends on

- `6lb8` — the Miro-like board. This is that board's movement model applied to
  a sticky that already exists, so the two must agree rather than ship two
  notions of "position on the board".
- `5y4b` — todo stickies carrying theme art. If a todo sticky has no theme in
  the first place, "loses its theme on unpin" is half-moot; do these together.

## Done when

- [x] Unpinning preserves the sticky's theme (art is `5y4b`)
- [ ] An unpinned sticky is visible and movable within the board frame
- [ ] The keyboard path survives — no drag-only affordance
- [ ] The inline-sticky case and its e2e test still hold

---

## Issue opened 2026-09-20

Author authorised it. <https://github.com/litlfred/folio-assistant/issues/558>,
carrying the verbatim report, both defects, the `docs-ui.js` locations, the
button-over-drag reasoning that must survive, and the `6lb8` / `5y4b`
dependencies. Nothing implemented — this waits on `5y4b` (a sticky with no
theme makes "loses its theme" half-moot) and must agree with `6lb8` on what
"position on the board" means.

- [x] The keyboard path survives — no drag-only affordance
- [x] The inline-sticky case and its e2e test still hold


---

## Theme half done, 2026-09-20 — and the defect was the reverse of the report

The owner reported the theme lost on UNPIN. Measured: `.fa-sticky-floating`
set a flat `background` and `color` **unconditionally**, and it sits after
`.fa-sticky` at equal specificity, so it won in BOTH directions — a themed
sticky was a slab of `#27262b` while pinned and came back to whatever the
board gave it. Which end a reader calls the loss depends on which end they
were looking at. Either way the pin button was changing what the note IS,
which is the sentence that matters and is the one in the bean.

### Two fixes, and the first is why the second is enough

**The theme is read from the TODO, in `buildSticky`.** That is the whole
round-trip guarantee, and it is structural rather than careful: `float`
CONSTRUCTS a second card on the layer and `dock` DESTROYS it, so a theme
carried on the DOM node is dropped by construction. Reading it in the one
function that builds a card means neither transition has to know the theme
exists. `data-fa-sticky-theme` is the attribute `themes.css` already selects
on, so this is the landing stickies' mechanism rather than a second one.

**The opaque override is scoped to `:not([data-fa-sticky-theme])`.** The rule
exists for a real reason — a sticky lifted onto the page sits over content and
must not be see-through — and narrowing it keeps that reason while dropping
the collateral. Sound because MEASURED: all 14 `--fa-sticky-surface` values in
the generated `themes.css` are opaque hex. The one translucent surface in the
system is `.fa-sticky`'s own `rgba(128, 128, 128, 0.08)` fallback, which
applies exactly when no theme is selected — exactly what the narrowed rule now
matches.

**That premise is now GATED**, because it is not one the schema enforces:
`ThemePaletteSchema.surface` is `z.string()`, so `rgba(…, 0.4)` parses.
`themes.test.ts` refuses a translucent surface and a translucent gradient stop.
Without it a theme added later reintroduces the bug on a page nobody
re-checks, and the symptom (text over page content) looks nothing like the
cause (one colour value in another file).

### The button stayed a button

The comment at `docs-ui.js` ~2006 was read first, as the bean says. Nothing
here touches the gesture: Pin is still a button, the greyed slot is still a
real recall control, and the keyboard test still passes. No drag was added.

### Falsified, both directions

31 e2e pass. The themed round-trip asserts the attribute on the board, on the
float layer, and on the board again after recall. The unthemed direction
asserts the narrowed rule is still present — and the CSS assertion was run
against the PRE-FIX stylesheet and does fail on it, so it is a guard rather
than a restatement.

### Not done — the MOVE half

*"you cant move around dispaly"* is untouched. An unpinned sticky still has
nowhere to go. That is `6lb8`'s board model, and the two must agree rather
than ship two notions of position — which is the open owner decision, since a
note's position is STATE and two sessions moving one note is a merge conflict.

### And `5y4b` is still the other half of "keeps its theme"

`theme` is on `ThemedTodoFieldsSchema` already; what does not exist is the
generator emitting it and the art behind it. The e2e fixture supplies the
field directly and is ahead of the pipeline by exactly that one field,
deliberately — it is what `5y4b` lands on.
