---
# folio-assistant-7vhe
title: 'FSH-GUTS viewer: dead fish icon under settings, with a node counter and a select dialog'
status: completed
type: task
priority: normal
created_at: 2026-09-19T10:48:10Z
updated_at: 2026-09-23T16:34:05Z
parent: folio-assistant-o3xy
---

Owner, 2026-09-19:

> only available under settings at dead fish icon. opening it shows a list of
> all the nodes in fsh-guts/ (has counter on icon) and use can open dialog to
> select and display them. can be webpages, todos, whaeber.

## What to build

- a **dead fish icon** in the settings area of the docs site
- a **counter** on the icon — how many nodes `fsh-guts/` holds
- clicking opens a **dialog listing every node**, and the reader selects one
  to display
- node kinds are open: a webpage, a todo, a proposal, whatever was thrown in

## The constraint that shapes it

The content is **not in the render pipeline**, so the viewer cannot link to
built pages — there are none. It reads `<base>/fsh-guts.jsonld` and renders
from that, client-side, the way the KG viewer already reads the graph
rendering. Look at `scripts/kg-viewer.ts` before designing a second
mechanism; if it can be reused, reuse it.

## Accessibility is not optional here

Bean `gjli` is a standing rule that ALL UI follows accessibility guidelines,
and this repo has live contrast failures (`y8cm`, `rptk`). A dialog is the
control most often built without keyboard handling: focus trap, Escape to
close, focus returned to the icon, the counter announced rather than
conveyed by the badge alone, and the icon needing an accessible name that is
not "dead fish".

## Done when

- [x] the icon appears only under settings, and carries a live count
- [x] the dialog is keyboard-operable and screen-reader legible
- [x] it renders each node kind, or says plainly that it cannot render that
      kind — never a blank pane
- [x] contrast is checked, not assumed

## Depends on

The store and its JSON-LD export. There is nothing to view before that.


---

**Re-parented to `o3xy` (UI & ACCESSIBILITY), 2026-09-19.** It hung off
`t0i3` (the fsh-guts store), which said something true — this is fsh-guts
work — and which `check-bean-parents` correctly refuses: a feature cannot
parent a feature, and the roadmap needs an epic. The relationship is recorded
here because the hierarchy can no longer carry it: **this depends on `t0i3`,
which is where the store and its JSON-LD endpoint live.**

## Summary of Changes

Closed 2026-09-23. The owner asked to "close beans and check for more". The viewer had shipped already: the dead-fish control under Settings, the count in its accessible name, the list, and the detail view, all covered by `cat-harness/test/discarded-items.e2e.ts`. Three of the four Done-when items were met by that spec. The fourth was not.

**"Contrast is checked, not assumed" was not true until today.** `a11y.e2e.ts` opens Settings, but its page publishes no `fa-fsh-guts-src`, so the control it measures is the "no document" branch. Neither the list nor an opened item was ever on screen for axe. Four axe specs now cover both views in both schemes, with the document stubbed.

**They found a real defect.** Contrast passed, but the opened item failed SC 2.5.8: the Back button measured **95.6 × 18.4px**. It was the only control leading back out of an item, and it was under the 24px floor on a site whose declared profile is low-dexterity. The Back button and the source link, which has the same shape, now have `min-height: 1.75rem` (28px).

Verified: `discarded-items.e2e.ts` passes 15/15. The two opened-item specs fail before the CSS change and pass after it.
