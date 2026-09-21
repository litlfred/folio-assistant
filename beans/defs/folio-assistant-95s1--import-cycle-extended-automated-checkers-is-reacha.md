---
# folio-assistant-95s1
title: 'IMPORT CYCLE: EXTENDED_AUTOMATED_CHECKERS is reachable in its temporal dead zone, and discovery only survives it'
status: todo
type: task
created_at: 2026-09-21T11:14:16Z
updated_at: 2026-09-21T11:14:16Z
parent: folio-assistant-vke6
---

Found while excising `harness.json` (bean 6n23, PR #695), and NOT fixed there.

`qa-checker-discovery.findChecker` enumerated a module namespace with
`Object.values`. That throws outright — `Object.keys` too — when any export is
a `const` still in its temporal dead zone, which happens when the module is
part of an import cycle and is read while mid-evaluation. Measured 2026-09-21:
`qa-checkers-extended.ts`'s `EXTENDED_AUTOMATED_CHECKERS`, reached through such
a cycle, took down an entire `qa-sweep` that had nothing to do with it.

## It predates the branch that found it

Checked rather than assumed: the failing test still failed with 6n23's
`profile-check` change reverted. What 6n23 changed is that the one-file model
REACHES it — a corrupt config is now a corrupt declaration, so the sweep takes
a path it did not take before.

## What was done, and what deliberately was not

`findChecker` now skips a binding it cannot read, and says in place that the
cycle is not fixed. That is the right call for a discovery routine — a value
that cannot be read is not a dispatch table, and the alternative is one cycle
anywhere costing every criterion its checker. But it is a GUARD, not a repair:
the cycle is still there and will surface somewhere else.

## Done when

- [ ] The cycle is identified — which modules, and which edge is the wrong direction
- [ ] It is broken, or declared acceptable with the reason written down
- [ ] If broken, the guard in `findChecker` is re-examined: it should stay only
      if it still guards something real
