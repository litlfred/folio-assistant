---
# folio-assistant-7vhe
title: 'FSH-GUTS viewer: dead fish icon under settings, with a node counter and a select dialog'
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T10:48:10Z
updated_at: 2026-09-19T13:24:17Z
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

- [ ] the icon appears only under settings, and carries a live count
- [ ] the dialog is keyboard-operable and screen-reader legible
- [ ] it renders each node kind, or says plainly that it cannot render that
      kind — never a blank pane
- [ ] contrast is checked, not assumed

## Depends on

The store and its JSON-LD export. There is nothing to view before that.


---

**Re-parented to `o3xy` (UI & ACCESSIBILITY), 2026-09-19.** It hung off
`t0i3` (the fsh-guts store), which said something true — this is fsh-guts
work — and which `check-bean-parents` correctly refuses: a feature cannot
parent a feature, and the roadmap needs an epic. The relationship is recorded
here because the hierarchy can no longer carry it: **this depends on `t0i3`,
which is where the store and its JSON-LD endpoint live.**
