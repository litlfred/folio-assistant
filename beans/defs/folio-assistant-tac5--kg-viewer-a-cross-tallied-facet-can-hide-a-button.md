---
# folio-assistant-tac5
title: 'KG viewer: a cross-tallied facet can hide a button that is still filtering'
status: todo
type: task
priority: normal
created_at: 2026-09-20T16:29:51Z
updated_at: 2026-09-20T16:30:17Z
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

- [ ] A SELECTED facet button is never hidden, whatever the cross-tally says.
      Hiding a zero-count button is right; hiding the one that CAUSED the zero
      is not.
- [ ] `aria-pressed` reflects the live selection, and an e2e test asserts it —
      the existing Subgraph tests assert counts and labels, so they pass
      through this.
- [ ] An e2e test that selects a subgraph, narrows another facet to empty, and
      asserts the selected button is still present and still `aria-pressed`.

## Not urgent, and say why

Reachable only by a specific two-facet sequence, and a reload recovers. It is
filed rather than fixed because the fix is in the tallying logic that decides
what to hide, and getting that wrong the other way — showing every button
always — throws away the affordance the cross-tally exists to provide.
