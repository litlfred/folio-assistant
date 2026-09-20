---
# folio-assistant-zsah
title: 'BOARD + NAVBAR TILES: every declared visualisation gets a tile, on two surfaces, hideable'
status: todo
type: task
priority: normal
created_at: 2026-09-20T21:47:28Z
updated_at: 2026-09-20T22:13:42Z
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
- [ ] the tile template is `1le7`'s, extended if it needs to be, never duplicated


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

- [ ] `SubgraphCoverageSchema` accepts >= 1 declared visualisation, each with a title; a bare string still parses
- [ ] every declared visualisation yields a tile — derived, never a second list
- [ ] a tile declares its surfaces (navbar / board / both)
- [ ] declared default visibility, with a per-reader override that commits nothing
- [ ] a tile's appearance defaults to the theme and may be overridden
- [ ] each tile opens the EXISTING visualisation — asserted by reuse (`kg-viewer.ts`, `7vhe`'s fsh-guts viewer, the `todos/` viewer in sibling work)
- [ ] the tile template is `1le7`'s, extended if it needs to be, never duplicated
- [ ] keyboard path into and out of every tile, accessible names on icon-only controls, target size at least the QR tile (`gjli`)
