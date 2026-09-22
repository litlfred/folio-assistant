---
# folio-assistant-whbf
title: 'Overview panel: the DYNAMIC half — drag, re-run layout, alternate arrangements'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-20T21:10:28Z
updated_at: 2026-09-22T06:40:21Z
parent: folio-assistant-vke6
---

Owner, 2026-09-20, splitting the work explicitly:

| dynamic stuff is bean for later.  but static visualiztion overview is needed.
| panel at top (colassibkle)

The static half shipped: a collapsible `<details>` panel at the top of the
schema viewer holding a deterministic SVG of the whole graph. See
`schema-management` §"The overview panel".

## What is NOT there, and is this bean

- Dragging a node, and the layout holding the new position.
- Re-running / switching layout (the ring is one arrangement; a layered DAG
  and a grouped cluster answer different questions).
- Zoom and pan beyond what the browser gives an inline SVG.
- Filtering the picture live from the list's facets — today the overview shows
  the page's SCOPE, not its current filter, which is deliberate but is a
  choice worth revisiting once the panel can be re-rendered cheaply.

## The constraint that does not relax

No CDN, no framework, no build step — `kg-viewer`'s rule, restated in
`schema-management`. A layout library is exactly the third party that rule
excludes, so the dynamic half is hand-rolled or it does not ship. That is a
real cost and is the reason this is its own bean rather than a follow-on
commit.

## What the static half established, and should not be re-litigated

- Granularity is adaptive: declarations at or under 70 in scope, modules above.
  Drawing 812 labelled declarations is the hairball `kg-viewer` measured at
  1111 nodes and is still ruled out.
- An edge that aggregation makes vanish is COUNTED and reported. 446 of 512
  edges here are intra-module; a dynamic view that drops that report
  reintroduces the defect.
- The layout is reproducible, not merely deterministic — every tie breaks on
  something stable. Any dynamic mode needs a way back to that arrangement, or
  a reader loses the picture they learned.

## Done when

Whatever lands, a reader can return to the static arrangement, and the
undrawn-edge count survives every mode.


## RE-SCOPED 2026-09-21 — the premise was stale twice, and measuring it produced `qttr`

This bean was opened to build the dynamic half on the assumption that the
static half was right and interaction was what was missing. Both halves of
that are out of date, and the second one was a defect.

### 1. The ring is gone

The list above says *"the ring is one arrangement; a layered DAG and a grouped
cluster answer different questions"*. The owner rejected the ring on
2026-09-20 — *"no, thats not what i wanted. i wanted UML like diagram for
schema declration"* — and it was replaced by the layered relationship diagram,
not extended. **The layered DAG this bean offers as an alternative is what
ships today**, so "switching layout" means something different now: the
candidates are a grouped-by-module cluster and whatever else, not a return to
the ring.

### 2. The static picture was not right — it was illegible

Measured across all 67 modules at a 1280px viewport before starting: the
widest, `dak-blocks.ts`, rendered its 10px font at **1.6px**, and **12 of 67**
were below a 5px effective glyph. `diaLayout` put each layer in one row with
no width budget, and the viewBox silently scaled the picture down to fit.

That is bean `qttr` ([#653](https://github.com/litlfred/folio-assistant/issues/653)),
opened and fixed rather than folded in here, because **wrapping needs no
interaction**: it stays printable, stays reproducible, and gives a reader the
picture for free on opening the panel, which is the panel's whole point.

### What that leaves for THIS bean

| item | status after `qttr` |
|---|---|
| zoom and pan | **weakened.** Every module is now legible at roughly 1:1 at 1280, 768 and 390px — 0 of 69 below a 5px glyph. Zoom would be for a reader who wants LESS detail, which the module filter already gives |
| alternate layouts | **still open**, and better posed: layered vs grouped-by-module, not layered vs ring |
| dragging | **argued against**, below |
| live filtering from the facets | **still open and unchanged** |

### Dragging fights this bean's own "done when"

The closing line requires *"a reader can return to the static arrangement"*. A
dragged position is by definition not reproducible, so every dragged picture
needs a reset the reader must know to use, and a reader who drags and reloads
loses the arrangement they had learned. The cost is also the highest of the
four — hit-testing, pointer capture and a position store, all hand-rolled,
since the no-CDN rule excludes a layout library.

**Recommendation: scrap dragging from this bean, keep the other three.** Not
done unilaterally — a ruling, per this bean's own framing of the trade.

### What still holds from the original, unchanged

The three constraints under *"What the static half established"* all survived
`qttr` and were respected by it: adaptive granularity, the counted-and-reported
undrawn edges, and reproducibility. `qttr` added a fourth of the same kind —
an edge label that has nowhere clear to sit is counted and said in the caption
rather than silently overstruck.


## RULED 2026-09-21 — dragging is SCRAPPED, on the owner's "Go"

Removed from this bean's scope, with the reason, rather than left as an item
nobody will pick up.

**It contradicts this bean's own closing requirement** — *"a reader can return
to the static arrangement"*. A dragged position is by definition not
reproducible, so every dragged picture needs a reset the reader must know
about, and a reader who drags and reloads loses the arrangement they had
learned. It is also the most expensive of the four items, since the no-CDN
rule makes hit-testing, pointer capture and a position store all hand-rolled.

### What this bean is now

| item | state |
|---|---|
| dragging | **scrapped**, above |
| zoom and pan | open, but weakened by `qttr` — 0 of 69 modules below a 5px glyph at 1280 / 768 / 390px, so zoom would serve a reader wanting LESS detail, which the module filter already gives |
| alternate layouts | open — grouped-by-module versus the layered arrangement that ships |
| live filtering from the facets | open, unchanged |

The remaining three are all optional improvements to a panel that now works.
This bean is no longer blocking anything, and a future session should weigh
each on its own rather than treating "the dynamic half" as one deliverable.

## CLAIMED 2026-09-22 — taking LIVE FILTERING only, of the three

Session `017MEZnJxx7WeekiNCabx4hx`, branch `claude/elegant-albattani-0byaig`.

Honouring this bean's own closing instruction — *"a future session should
weigh each on its own rather than treating 'the dynamic half' as one
deliverable"* — rather than opening all three.

**Live filtering, because it is the only one of the three where the current
behaviour MISLEADS.** A reader filters the list, the picture does not move,
and nothing on the page says why. The bean records that as deliberate (the
overview shows SCOPE, not filter) and that is defensible as a design, but an
undisclosed deliberate choice and a bug look identical to the person looking
at them. The other two are improvements to a panel `qttr` already made
legible.

Not taking zoom/pan: this bean already argues it is weakened — 0 of 69 modules
below a 5px glyph at 1280/768/390px after `qttr`, so zoom serves a reader
wanting LESS detail, which the module filter gives. Not taking alternate
layouts: separate judgement, separate cost, and it does not fix anything.

### The precondition I have to establish, not assume

This bean conditions live filtering on the panel being **re-renderable
cheaply**. That is unmeasured. If a facet click means recomputing the layered
layout for the largest module, the honest outcome may be to report the cost
and stop rather than ship a panel that stutters.

### What must survive, from the static half

- adaptive granularity (declarations at/under 70 in scope, modules above)
- the **counted-and-reported** undrawn edges — 446 of 512 here are
  intra-module, and a mode that drops that report reintroduces the defect
- reproducibility, and a way back to the arrangement a reader has learned

### Constraint

No CDN, no framework, no build step. Hand-rolled or it does not ship.
