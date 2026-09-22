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

## DONE 2026-09-22 — live filtering. The bean stays open for the other two.

Shipped: the overview panel follows **every** filter, not the module select
alone. `bun run gates` 103/103, `bunx playwright test` **371 passed**.

### The root cause was two predicates, not a missing feature

`render()` honoured search, kind and module; `diaModel()` honoured module
alone. Two filter expressions over one question is how they drifted, so the
fix is `matchesFilter(d, q, k, m)` with both callers going through it. Adding
`q` and `kind` to `diaModel`'s own expression would have shipped the feature
and left the defect.

### A search now EARNS a picture that did not exist before

This is the part worth knowing, and it was not in the bean. At 842
declarations the page is over `DIA_MAX = 40` and **refuses to draw** — so
before this, the only way to get a diagram at all was to already know which
module to pick. Measured:

| filter | in scope | draws? |
|---|---|---|
| none | 842 | **no** — refuses |
| search `workflow` | 6 | yes |
| search `bean` | 10 | yes |
| search `role` | 26 | yes |
| kind `zod-enum` | 35 | yes |

A reader who does not know the module name had no picture and now has one.

### The bean's own "done when" cited a DELETED mechanism

*"the undrawn-edge count survives every mode."* It could not: `ovModel`'s
intra-module counter — the "446 of 512" this bean quotes — went with the ring
when the layered diagram replaced it in `3f629d42b`. No `internal`, no
`OV_DECL_MAX`, no aggregation survives; `DIA_MAX` **refuses** rather than
aggregating, so there was nothing left to count and nothing said so.

Restored for the loss the current layout actually has: a relationship between
two **faded context boxes**. Both boxes are drawn, and the line between them
is suppressed because the picture is about the filter rather than its
surroundings — so an unreported drop tells the reader *these two are
unrelated*, which is a false statement the picture makes silently. Measured
over the committed projection: **15 summed across the 79 module filters**, 0
across eight sample searches.

Self-edges are also dropped there. Measured at **0** occurrences, so no report
was added for a case that does not arise — said here so the next reader does
not re-derive it as an omission.

### My own change made an existing message wrong, and that is the interesting bug

The empty state read *"Nothing in scope to draw."* That was **true** while
only scope and the module select could empty the set. Once a search can, the
same words blame the SUBJECT for what a filter did, and a reader who typed a
word matching nothing is told the page is empty. It now names the cause and
says how to get back.

A correct message can be falsified by a change elsewhere. Nothing would have
caught this: it is not a type error, not a failing assertion, and the words
did not change.

### Two errors of mine, both caught by measuring rather than by review

1. I wrote into a code comment that *"a tighter filter makes more of them"*
   about the suppressed edges. Plausible, and **false**: 15 across module
   filters versus 0 across eight searches. Asserted, then measured, then
   corrected in place with the correction left visible.
2. The first draft of the suppression test ended
   `expect(typeof sawSuppression).toBe("boolean")` — **true whether the loop
   found anything or nothing.** A check that passes over an empty examination
   is the `dh4f` shape, and writing one into the test for the
   count-it-rather-than-drop-it contract is that defect one level up. Now
   asserts the loss occurs, on the 15-across-79 margin.

### Falsified both ways, twice

- Reverted the search wiring → **4 of 7 fail**, and the 3 that do not depend
  on it stay green. Restored → 7 pass.
- Removed the suppression clause from the caption → test 5 reddens with its
  named reason. Restored → passes.

### Accessibility is part of the deliverable, not a follow-up

`gjli` is load-bearing here rather than boilerplate: the declared interaction
profile is low-dexterity, so a filter only a mouse can reach would have made
the picture follow the list for everyone except the person the page is built
for. Two tests drive the whole path from the keyboard — `<summary>` focus +
Enter to open, type to narrow, select-all + Backspace to return — and assert
an accessible name on all three controls, the `gjli` finding (3) shape.

### What is NOT in this change

The regenerated projection. `schema:viz:check` is deliberately **not** gated
(owner, 2026-09-20) because both projections derive from the whole repository
and go stale whenever `main` moves. Regenerating grew it 842 -> 901
declarations from four merged commits that are not this work, so it is
reverted: 2511 lines of somebody else's churn in a live-filtering diff is
review noise and manufactures conflicts with the sibling branches. The
published copy is rebuilt by `docs-site.yml`.

### Still open on this bean

- **zoom and pan** — weakened by `qttr`, and weakened further by this change:
  a search now narrows the picture, which is the other way to get less on
  screen.
- **alternate layouts** — grouped-by-module versus the layered arrangement.

Unchanged from the re-scope: neither blocks anything, and each deserves its
own weighing rather than being inherited as "the dynamic half".
