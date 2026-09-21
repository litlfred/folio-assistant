---
# folio-assistant-pv6g
title: 'GLASS: the fixed layer exists as a bottom-right dock, not a surface a note is placed on'
status: todo
type: bug
priority: high
created_at: 2026-09-21T17:28:39Z
updated_at: 2026-09-21T17:31:42Z
parent: folio-assistant-6lb8
---

Owner, 2026-09-21: "stickies can detach from the panel and placed on the 'display window/glass' and dont scroll when the folio/document/page scrolls. when closed tehy returned to their home display panel."

CORPUS CHECK. The layer EXISTS and is already fixed — docs-ui.css:2263, '.fa-sticky-layer { position: fixed; inset: auto 1rem 1rem auto; width: min(22rem, calc(100vw - 2rem)) }'. So 'does not scroll' is already true. What is missing is that it is a DOCK, not a GLASS: every pinned sticky lands in one bottom-right column at no position of its own, which is exactly the second half of ivfw (#558) — 'you cant move around dispaly'.

Also missing and NOT anywhere in the corpus: a sticky's HOME PANEL. Nothing records where a detached sticky came from, so 'when closed they returned to their home display panel' has no field to return to. Note this is a THIRD sense of the words 'sticky panel' — see 6lb8 section 6, where the sticky panel is the per-content-node list of every sticky attached to that node. Those are different objects and the owner flagged the conflation: 'there are some different context being conflated maybe'.


## RE-MEASURED 2026-09-21T19:05Z — the GLASS half is already built

This bean's CORPUS CHECK quotes `docs-ui.css:2263` as

> `.fa-sticky-layer { position: fixed; inset: auto 1rem 1rem auto; width: min(22rem, calc(100vw - 2rem)) }`

and concludes the layer is *"a DOCK, not a GLASS"*. **That was true when it was
checked and false within eight minutes**, and the timestamps are why:

| | when |
|---|---|
| `ivfw`'s change committed (`791e52fd`) | 17:21:11Z |
| **this bean created** | **17:28:39Z** |
| PR #758 merged to `main` (`89e59f17`) | 17:29Z |
| this bean last updated | 17:31:42Z |

So it was written in the window where the fix existed on a branch and not on
`main`. Nobody did anything wrong: the check read the corpus it could see.

**On `main` today the layer is the glass this bean asks for:**

```css
.fa-sticky-layer { position: fixed; inset: 0; z-index: 90; pointer-events: none; }
```

Full viewport, `pointer-events: none` on the frame and `auto` on the cards, each
card carrying its own geometry from `placeFloating`, moved by `wireMove` —
keyboard first, drag as the accelerator. *"Do not scroll"* was already true and
still is; *"placed on the display window/glass"* is now true too.

**This is `k59d`'s defect class one level out.** `k59d` is about an open bean
naming a CLOSED bean as a blocker; this is a bean whose measured premise went
stale between two commits. A corpus check is a measurement, so it carries a
time, and a bean that states one without a timestamp cannot be re-read safely.

## What REMAINS, and it is the half with no corpus at all

> when closed tehy returned to their home display panel

**There is still no HOME PANEL anywhere.** Measured on current `main`:

- `mountTodoBoard` keeps a `slots` map keyed by todo id, and `dock()` returns a
  floated sticky to `slots[todo.id]`. That is a home — but an **implicit** one,
  living in one board's closure rather than recorded on anything.
- A **landing sticky** is rendered by `landing.html` as a direct child of
  `.fa-landing-board` and has no slot at all, so it has nowhere to return to.
- Nothing carries "which panel did this come from" as a property, so the
  question cannot be asked of a sticky in general — only answered by whichever
  board happens to hold the closure.

**And the owner already flagged the conflation this sits on**: *"there are some
different context being conflated maybe"*. *Sticky panel* means at least three
things — the per-content-node list of everything attached to a node (`6lb8`
§6), the panel a detached sticky came FROM (this bean), and the landing
stickies' own container (`z1ug`). Naming the home before those three are
separated would bind the field to whichever sense was in view.

**Not claimed.** The remaining half overlaps `z1ug` (issue #756 items 1, 2, 4),
which decides where landing stickies live — and a home-panel field chosen
before that is a field chosen against a layout about to change. Left `todo`
with the glass half struck out, so whoever takes it starts from what is
actually missing rather than rebuilding what shipped.
