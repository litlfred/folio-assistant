---
# folio-assistant-tac5
title: 'KG viewer: a cross-tallied facet can hide a button that is still filtering'
status: completed
type: task
priority: normal
created_at: 2026-09-20T16:29:51Z
updated_at: 2026-09-22T06:05:00Z
parent: folio-assistant-o3xy
---


Found by review 2026-09-20, in the Subgraph facet this branch added.

`scripts/kg-viewer.ts:761`. The facet buttons are cross-tallied: a button is
hidden when the current selection in the OTHER facets leaves it with no
matching nodes. But a Subgraph button that is already SELECTED is still
filtering, so narrowing another facet can hide the selected button while its
filter stays in force. The result is an empty node list with no visible
control explaining why, and no `aria-pressed` anywhere on the page to say a
filter is active.

Two distinct defects in one behaviour:

1. **Recoverability.** The user cannot unselect what they cannot see. The only
   way out is a reload, which is not a control.
2. **Accessibility.** With the button gone there is no `aria-pressed="true"`
   left in the DOM, so a screen reader is told nothing is filtered while the
   list is filtered to empty.

## Done when

- [x] A SELECTED facet button is never hidden, whatever the cross-tally says.
      **Already true, structurally** — a button exists iff its tally under the
      other selection is non-zero, so picking one guarantees a non-empty
      intersection and both buttons re-render. Now pinned by an e2e test
      rather than left as a property nothing asserted.
- [x] `aria-pressed` reflects the live selection, and an e2e test asserts it.
      Asserted per GROUP, which is stronger: every group carries exactly one
      pressed control at rest, while filtered, and after undo.
- [x] An e2e test that selects a subgraph, narrows another facet to empty, and
      asserts the selected button is still present and still `aria-pressed`.
      **Cannot be written as specified, and that is the finding**: the state
      it describes is unreachable, because a facet cannot be narrowed to empty
      while a selection is in force. The test added instead selects a subgraph
      and then a kind — the nearest reachable sequence — and asserts both
      buttons survive with a non-empty list.

## Not urgent, and say why

Reachable only by a specific two-facet sequence, and a reload recovers. It is
filed rather than fixed because the fix is in the tallying logic that decides
what to hide, and getting that wrong the other way — showing every button
always — throws away the affordance the cross-tally exists to provide.

---

## 2026-09-22 — NOT REACHABLE, and the bean is closed on that rather than on a fix

The scenario cannot be produced. I went looking for it in the real browser
first and could not construct it; the source then says why.

### The invariant

`kind` and `sub` are written in exactly **two** places — the two `onPick`
handlers in `drawFacets`. `drawGroup` wires `onPick` only to buttons it
rendered, and it renders one button per key in `counts`, which `tally()`
builds only from nodes the OTHER facet admits.

So a button exists **iff** its value has a non-zero tally under the current
other-selection. Picking one therefore leaves the two selections with a
non-empty intersection — and a non-empty intersection is exactly the
condition for both buttons to be re-rendered on the next `drawFacets()`.

There is no other way in: no hash state, no query parameter, no restore. The
only `URLSearchParams` use is `lang`.

### The a11y half was wrong for a second reason

The bean says *"no `aria-pressed` anywhere on the page to say a filter is
active"*. Measured: there are always **two** elements with
`aria-pressed="true"` on a page at rest — `drawGroup` marks **All** pressed
when the selection is `null`, once per group. A group is never without a
pressed control.

That claim would have held *conditionally on the hiding*, since a hidden
selected button leaves `All` reading `false` and nothing reading `true`. With
the hiding unreachable it is moot — but it is worth recording that the
premise was two steps removed from the page, not one.

**I found this by running the page, not by reading it.** My first test
asserted zero pressed controls at rest and failed against two, which is how
the `All`-is-pressed behaviour surfaced at all.

### What was added instead of a fix

Two e2e tests, in `kg-viewer.e2e.ts`, asserting the INVARIANT rather than the
defect:

- picking a subgraph then a kind leaves **both** selected buttons on the page,
  with a non-empty list;
- **every** facet group always has exactly one pressed control — at rest,
  while filtered, and after undo — and the undo returns the full list.

The second is the stronger statement and is the one that forbids this bean's
scenario directly: its failure state is a group with **no** pressed control.

A test reproducing nothing would be worth little. These pin the property that
makes the defect impossible, so a change that breaks the invariant fails here
rather than shipping the scenario for real.

## Summary of Changes

- No production change. The reported defect is not reachable.
- `cat-harness/test/kg-viewer.e2e.ts`: two tests pinning the invariant.
- Correction recorded: the page always carries a pressed control per group,
  so the bean's `aria-pressed` claim was wrong independently of reachability.
