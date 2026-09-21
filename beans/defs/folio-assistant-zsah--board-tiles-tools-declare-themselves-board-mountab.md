---
# folio-assistant-zsah
title: 'BOARD + NAVBAR TILES: every declared visualisation gets a tile, on two surfaces, hideable'
status: completed
type: task
priority: normal
created_at: 2026-09-20T21:47:28Z
updated_at: 2026-09-21T15:11:16Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — R12 + R16, and it is mostly a REUSE constraint. Unit 9 of 10.

**CRDM Q8, answered:** *"3 + default wtih sticky and fsh guts and tile(s) for KG
viewer(s) and docs"* — so tiles come from the **Tool registry** (a tool declares
itself board-mountable), **plus a default set** every board carries: new sticky,
fsh-guts, KG viewer(s), docs.

And then, immediately after: **"those should open their exisiting visualzaiton"**.
That is the whole shape of this unit. A KG-viewer tile MOUNTS `scripts/kg-viewer.ts`;
a docs tile opens the docs rendering. **Nothing here builds a second viewer.**

**Check before building**, because three of these already have beans and two are
in flight:

| | |
|---|---|
| `1le7` | Action-icon tiles — one QR-sized tile template for settings / languages / KG viewer. **This is the tile template; do not mint a second one.** |
| `7vhe` | fsh-guts viewer, dead fish icon + counter + select dialog |
| `xgd8`, `jbx2`, `v1hw` | the per-graph visualisers a tile would open |

## Done when

- [ ] a tool declares itself board-mountable; the board discovers tiles rather than hardcoding them
- [ ] the default set is present on every board: new sticky, fsh-guts, KG viewer(s), docs
- [ ] each tile opens the EXISTING visualisation — asserted by reuse, not by screenshot
- [x] the tile template is `1le7`'s, extended if it needs to be, never duplicated — HOISTED
      to module scope so both surfaces share it


---

## Corrected by the owner, 2026-09-20 — a tile is a function of the HARNESS, not of nodes

The question put to them was whether each *graph* gets a create action. The answer
rejected the framing, and it is the better model:

> no, its not a function of nodes, its a function of a harness watching a directort
> in repo root/ (or other general service that replicates gtihub use now). basially
> if harness declares visaluzers, those should have tile. defaults to theme, but new
> can be changed. harness can declare >= 1 visualiztion (which then has a title)

And, earlier in the same exchange:

> todos tile can create new tile/stky or open todos/ visualiton (see sibling work)
> same for beans/ and fsh-guts/ (which has tile w/ navbar too i think). tiles in
> nvbar and folio. tiles can ben hidden away/out of frame

### What that settles

**The declaration point already exists and is already audited.**
`SubgraphCoverageSchema.visualiser` in `schemas/cat-harness.ts` is where an instance
says what renders a directory, and `kg:audit` already reports *"todos / visualiser:
no visualiser declared, and todos owes one"* for thirteen directories in this
repository. **So the tile set is not a new registry — it is the visualiser
obligation made reachable.** A graph that owes a visualiser owes a tile, and the
audit that already says so needs no second list to disagree with.

**One change to that schema**: `visualiser` is a single optional string, and the
owner says a harness may declare **≥ 1 visualisation, each with a title**. So it
widens to accept a list of `{ ref, title }`, with a bare string still meaning one
visualisation — additive, because a REQUIRED field is a change every concurrent
branch pays for (the `dependents` lesson recorded on that very schema).

**A tile's look defaults to the THEME and may be overridden**, which is the same
inherit-and-override rule `semantic-zoom.ts` already encodes, and for the same
reason: a tile that states nothing is complete, not invalid.

### The three answers, 2026-09-20

| | answer |
|---|---|
| **Q9** hiding | **declared default, reader may override.** The folio says which tiles start out of frame; a reader's own hiding is theirs alone and is committed nowhere. `1le7` already records the pressure — *"that navbar is getting crowded"* — and there are **33** declared directories in `cat-harness` today, so this is not hypothetical |
| **Q10** create | not per node kind. The harness watching the directory supplies it |
| **Q11** surfaces | **one declaration, per-surface visibility.** A tile is declared once and says whether it shows in the navbar, on the board, or both — never two registries free to disagree about what a tile is |

### Done when (replacing the list above)

- [x] `SubgraphCoverageSchema` accepts >= 1 declared visualisation, each with a title; a bare string still parses
- [x] every declared visualisation yields a tile — derived, never a second list
- [x] a tile declares its surfaces (navbar / board / both)
- [x] declared default visibility, with a per-reader override that commits nothing
- [x] a tile's appearance defaults to the theme and may be overridden
- [x] each tile opens the EXISTING visualisation — asserted by reuse (the href IS the declared
      ref resolved, checked against `graph-tiles.ts`'s own answer)
- [x] the tile template is `1le7`'s, extended if it needs to be, never duplicated — HOISTED
      to module scope so both surfaces share it
- [x] keyboard path into and out of every tile, accessible names on icon-only controls, target
      size at least the QR tile (`gjli`) — inherited from `1le7`'s template rather than restated


## From sibling work merged 2026-09-20 — `flh4`, and the distinction it paid for

`flh4` (STATE PAGES) found `uploads` rendered as *"this graph is declared and
nothing publishes a projection for it yet"* while both `harness.json` files gave it
a `coverage.visualiser`, that page existed, and it rendered live counts. Cause:
`projectionFor(id)` asked the disk for `assets/<id>/index.json` only, and `uploads`
publishes inside `assets/library/index.json` — so *"no projection AT MY PATH"* was
collapsed into *"nothing renders this"*. **Two different facts.**

**That distinction is this bean's too, and it decides which one a tile derives
from.** Measured on the merged tree, 2026-09-20:

| | declared `coverage.visualiser` | live projection |
|---|---|---|
| `uploads`, `library` | yes | yes |
| `beans`, `todos` | **no** | yes |
| `fsh-guts`, `qa`, `health`, `memory`, `interaction`, `issue-marks` | no | no |

So `beans` and `todos` — two of the three tiles the owner named — have a working
viewer and **no declaration**. A tile derived from the PROJECTION would appear for
a graph nobody declared a visualiser for; derived from the DECLARATION it would be
missing for two graphs that visibly have one.

Neither is a bug to code around: it is the third state `flh4` names. **The tile
derives from the declaration, and a live projection with no declaration is a
FINDING** — which is what closes the gap rather than papering over it. `beans` and
`todos` want their `coverage.visualiser` filled in; that is a line each, and it is
prerequisite work for this bean rather than part of it.

Also adjacent, merged the same day: `whbf` (Overview panel, the DYNAMIC half —
drag, re-run layout) under `vke6`. Its drag/layout work and `le8b`'s board movement
are the same problem on two surfaces and should not grow two answers.

## Summary of Changes

**The tile set is the visualiser obligation made reachable, not a second
registry.** `SubgraphCoverageSchema.visualiser` widened to accept a list of
`{ref, title, surfaces?, hidden?, theme?}` — **a bare string still parses**,
which is the whole shape of the change: 27 declared paths here are bare strings,
and a widening that cost each an edit would be a required-field change wearing an
optional one's clothes. `visualisationsOf()` is the one place the two shapes
become one, so no consumer knows the field has two.

`scripts/graph-tiles.ts` derives tiles from those declarations and publishes them
into `_data/harness.json` — **one array for both surfaces** (Q11), which the
navbar and the board filter by `surfaces`. Two registries would be free to
disagree about what a tile IS, and the disagreement would be invisible.

## The prerequisite the bean named, done

`beans` and `todos` had working viewers and **no** `coverage.visualiser` — the
bean measured it and called it prerequisite work. Declared, one line each. They
are two of the three tiles the owner named, and without the declaration they
would have been the two missing ones.

## Three defaults, and each says why absent is COMPLETE

- **Surfaces** absent means BOTH. A tile that states nothing is a tile that
  appears, not a tile that is broken.
- **Hidden** absent means shown — the DECLARED half of Q9. The reader's half is
  session state that reaches no store, because a reader's view of the navbar is
  not a change to the navbar. Same separation `reader-filter.ts` holds.
- **Theme** falls back to the directory's, then the instance's. The same
  inherit-and-override rule `semantic-zoom.ts` encodes.

## `flh4`'s third state decided what a tile derives from

A tile derived from the PROJECTION would appear for a graph nobody declared;
derived from the DECLARATION it is missing for a graph that visibly has a viewer.
Neither is a bug to code around. The tile derives from the declaration, and a live
projection with no declaration is a FINDING (`undeclaredProjections`,
`tileFindings`) naming the repair rather than the symptom — which closes the gap
instead of papering over it. Adding a tile silently would have made the audit that
reports the gap look wrong.

## `prc5`, one layer down

A declared path is not a published URL. `publishedHref` strips the site
directory's prefix and turns `index.html` into the directory route; a ref outside
the published site gets **no href**, and the tile renders unlinked rather than as
a link to nowhere. The tile still appears, because it is what says the
visualisation was declared.

## Two things the checks corrected

**`check:partition` corrected my classification.** `graph-tiles.ts` went in as
core, on the reasoning that a tile is something a reader sees. The checker
answered with a wrong-direction edge from `sync-docs-harness.ts` — the import was
right and the classification was wrong: this module reads instance DECLARATIONS
and answers a question about the machinery.

**TypeScript refused all three readers of `visualiser`** the moment it widened,
which is the point of widening a type rather than a value: `check-subgraph-coverage`
now checks every ref independently (*"one of your two viewers is missing"* and
*"your viewer is missing"* are different repairs), `harness-tiles` likewise, and
`state-visualizer` takes the first and says why.

`bun run gates --all` — 92/92, 324 e2e.
