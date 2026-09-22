---
# folio-assistant-p5wm
title: 'GOAL 2: LHS navbar working with instantiated harness, showing folios with the bootstrap exception, and stickies that move around on the folio'
status: in-progress
type: milestone
priority: high
created_at: 2026-09-20T18:48:29Z
updated_at: 2026-09-20T18:48:29Z
---

The owner's words, 2026-09-20 (session_017PqeiS4JYySSWGAYLedmus), kept verbatim:

> get LHS navbar working w/ instantiated harness and showing folios (w/
> bootstrap/ exception), stickyes that move around on folio (need reorderion
> of folio/miro objects).

Created on the owner's ruling for bean `wqht`: *"wqht - milesotne"*.

## Epics under this milestone

| epic | why |
|---|---|
| `yj32` | HARNESS AS INTERFACE — a harness instance's default rendering is LHS + docs/ + a themed folio board. This is the goal restated. |
| `o3xy` | UI & ACCESSIBILITY — the rendered site is the artefact a reader judges, and every sticky and navbar bean sits under it. |

## The measurement that sets the starting point

**The navbar does not exist.** `grep -rln navbar` over `cat-harness/schemas`,
`src`, `ui`, `viewer` and `home_page` returns nothing. The left-hand nav today
is just-the-docs' own `.site-nav`, and the only code touching it rewrites
hrefs per locale. So "get the LHS navbar working" is a build, not a fix.

## Critical path, in dependency order

`b5f0` → `603s` → `hfkl` → `2krx` → (`6lb8` ‖ `ivfw` + `5y4b`) → `pb04` →
`supn`, with `gjli` (accessibility) a standing gate on every step and `1hvo`
supplying the declaration layer that `603s`'s `avatarRegion` and `5y4b`'s
todo theme both need.

- **`b5f0` first**, and it is not a UI bean: it holds the ruling that settles
  `603s`'s own first open question, which file marks an instance.
- **`o7eq` is this goal's URL layer** — the owner's rule that rendered assets
  live at `<baseurl>/<instance>/<declared graph>/<path>`. It says what each
  navbar section's href *is*.
- **"stickies that move around" is `ivfw` + `6lb8`**, and they must land
  together: `ivfw` says *"the two must agree rather than ship two notions of
  'position on the board'"*. `ivfw`'s theme-preservation half is small and
  can ship alone; the movement half waits on `6lb8`'s persistence answer.
- **The bootstrap exception is `hfkl`**, and it is the cheapest real win: the
  owner's ruling is already quoted in the bean, and it unblocks `2krx`, which
  otherwise fires 19 findings on day one.

## Blocked on the owner

- **waits on:** the owner — `yj32`, `6lb8`, `v1hw`, `jbx2`, `h32d`, `g196`, plus three items needing a look at a deployed page
- **since:** 2026-09-20
- **expires:** 2026-09-29 — a REVIEW date, not a takeover date; see the handoff
- **handoff:** on expiry, re-raise the list with the owner rather than deciding any of it. A milestone's critical path going stale is exactly what `k59d` was opened to catch.


`yj32` (*"i wanted bootsrap/ harness/ etc as todos, not landing page info"*,
and what the writable store is), `6lb8` (the board's persistence — a position
is state, and `todos/` is committed, so two sessions moving one note is a
merge conflict in a generated file), `v1hw` and `jbx2` (which write path),
`h32d`, `g196`. Plus three that need somebody to LOOK at a deployed page:
`alox`, `rptk` and `o3xy` as a class.

## Done when

- [ ] The LHS navbar shows one themed section per instantiated instance,
      scanned from the root, in dependency order, with bootstrap as the
      declared exception
- [ ] A folio's stickies can be moved, and keep their theme when unpinned
- [ ] The layout works for a two-instance folio and renders without error
      for a zero-instance one
