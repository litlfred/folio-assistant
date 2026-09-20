---
# folio-assistant-1hvo
title: 'THEMING: a cat-harness/theming/ subgraph, broken up thematically'
status: todo
type: task
created_at: 2026-09-20T14:28:56Z
updated_at: 2026-09-20T14:28:56Z
parent: folio-assistant-yj32
---

Owner, 2026-09-20, verbatim:

> also themeing skills under cat-harness/thermeing/.  break up thematically.

## What it asks for

A `cat-harness/theming/` subgraph holding the theming skills, **broken up
thematically** rather than kept as one block.

## Why this is worth doing rather than cosmetic

Theming is currently spread across places that do not name themselves as
theming, and the session that produced this instruction is the evidence: the
work touched `schemas/themes.ts`, `schemas/landing-sticky.ts`, the generated
`docs-ui.css`, `themes:css`, `check:theme-art`, the scrim measurement rules and
the avatar crop boxes — with the discipline recorded in
`skills/folio-core/theme-art-intake.md` and nowhere else.

**The defect that keeps recurring is exactly the one a thematic split fixes.**
Four rounds of "still not image" were one cause: a theme with no CSS rule falls
back to an opaque surface and paints over its own art, so `themes:css` must be
run. That is a *theming* fact with no theming directory to live in, so it lives
in a comment and in one skill's prose, and it was rediscovered rather than
read.

## Measured before claiming

- **`skills/folio-core/theme-art-intake.md` exists** and already carries the
  intake discipline, including the fires-on-every-subject rule recorded twice.
  Moving it is a relocation, and **ids are stable across a relocation while
  paths are not** — an override matches on id, so the move must keep ids or
  every consumer scans a directory that is not there
  (`directory-conventions`).
- **A declared directory needs a visualiser and a documentation entry** under
  `2krx`. A new `cat-harness/theming/` subgraph therefore arrives owing both,
  and shipping it without them manufactures the finding rather than clearing
  it.
- **"Break up thematically" is not specified further.** Candidate axes, none
  chosen: intake (art -> webp -> crops -> digests), palette and contrast
  (scrims, WCAG, the eleven themes), declaration (`themes.ts`, per-layout
  `textRegion`, the proposed `avatarRegion` from `603s`), and generation
  (`themes:css`, and the fallback that paints over art). **Ask which axis
  before splitting** — a wrong split is more expensive than no split, because
  every consumer moves twice.

## Done when

- [ ] `cat-harness/theming/` is declared, with its graph kind and `dependents`
- [ ] The theming skills live there, split on an axis the owner chose
- [ ] It has the visualiser and documentation entry `2krx` requires, or an
      explicit exemption like bootstrap's (`hfkl`)
