---
# folio-assistant-i8ad
title: Count interprets as an editorial edge in the content graph
status: completed
type: task
created_at: 2026-08-15T21:20:00Z
updated_at: 2026-08-15T21:20:00Z
---

Owner decision, 2026-08-15, choosing (a) from the options put in `prn1`.

`buildContentGraph` builds editorial edges from `uses[]` **alone**. But
`interprets:` is equally authored and equally editorial — a remark interpreting
a proposition cannot be followed without having read it, which is precisely what
the editorial relation means. So the graph answered "what must a reader have
read?" while omitting 342 authored statements of exactly that, and the
prune-damage audit inherited the omission: 37 still-lost edges are declared,
just in the other field.

> **Correction to my own framing when I proposed this.** I argued that the
> detangler "already treats `interprets` as an ordering constraint", so the
> graph and the checker disagreed. **That was wrong.** `loadChapterGraph`
> explicitly excludes it — the comment at its `uses` parse reads "only the uses
> array — NOT cites/interprets/own-label". The guard I was remembering was in my
> own scratchpad reordering tool, not the platform. The change stands on the
> plain reading above; it did not need the argument I gave it.

## Measured before changing anything

| | |
|---|---|
| blocks declaring `interprets` | 1041 |
| target does not exist (dangling) | **0** |
| already in `uses[]` as well | 699 |
| **new graph edges** | **342** |

Three consequences, all of which the decision accepts:

- **Cycles: exactly one.**
  `rem:frobenius-packing-density → conj:mass-volume-factorization →
  rem:frobenius-packing-density`. The remark interprets the conjecture and the
  conjecture's `uses[]` reaches back. The `uses[]` graph was made acyclic
  deliberately (#4881), so this breaks that invariant — but it does so by
  *revealing* a genuine editorial cycle, not by inventing one. It is an author
  question, not something to paper over.
- **Forward references: the gate does NOT move.** I predicted 194 → 204. Wrong,
  for two reasons. `detangler-no-forward-ref` reads `loadChapterGraph`'s own
  `uses`-only adjacency and never touches this module, so it is untouched —
  measured directly from the checker, it is **195** before and after. (195, not
  194: 194 was a figure taken before the `extractUses` fix, and I had also
  corrected it once already in this arc.)

  Ten `interprets` edges *do* point forward. The gate cannot see them. That is a
  real gap, now visible, and left as a **separate** decision rather than folded
  into this one — widening what the gate counts would move a number five merged
  PRs were measured against, and that deserves its own call.
- **Prune damage: 658 → 581.** More than the 37 direct, because the new edges
  restore transitive reachability for others.

## Plan

- [x] Parse `interprets` through the shared masked field scanner, not a new regex
- [x] Add as an editorial edge, tagged with its provenance so a consumer can
      still tell `uses` from `interprets`
- [x] Update the module contract and `AGENTS.md`, which both currently say the
      editorial relation *is* `uses[]`
- [x] Report the cycle and the ten forward refs rather than absorbing them
      silently

## Summary of Changes

`interprets` is now an editorial edge. Measured on the `qou` corpus: **4820
`uses` edges + 342 `interprets` edges**, matching the dry run exactly.

Parsed with a new `parseStringField` in `uses-field.ts`, sharing the masked
locate that `findArrayField` uses. Not a fresh regex: a naive
`/interprets:\s*"([^"]+)"/` falls to both traps this area keeps producing — a
comment before the field, and the field name quoted in prose — and this corpus
discusses `interprets:` by name inside block bodies, so the second is live.

Each editorial edge now carries `editorialField: "uses" | "interprets"`. A
reader cannot tell the two apart and should not have to; a tool proposing an
edit must, because `uses[]` is a curated list and `interprets` is a single
structural claim.

`AGENTS.md` and the module contract updated — both previously stated that the
editorial relation *is* `uses[]`, which is now wrong rather than merely
incomplete.

### The one cycle, reported not absorbed

`rem:frobenius-packing-density → conj:mass-volume-factorization →
rem:frobenius-packing-density`. The remark interprets the conjecture; the
conjecture's `uses[]` reaches back to the remark. The editorial graph was
deliberately made acyclic in `#4881` and is no longer, so this needs an author
decision — but it is a genuine editorial cycle **revealed**, not one introduced
by the change. Nothing here papers over it.

### What did not happen, contrary to my prediction

The forward-reference gate does not move: **195 before, 195 after**, taken
straight from `checkDetanglerNoForwardRef` over every block.
`loadChapterGraph` builds its own `uses`-only adjacency and never touches
`content-graph`. Ten `interprets` edges do point forward and that gate cannot
see them — left as a separate decision, because widening what it counts moves a
number five merged PRs were measured against.

### Effect on `prn1`

Prune damage on the union: **658 → 581**. More than the 37 directly-declared,
because the new edges restore transitive reachability for others.

tsc 0 · 702 tests / 0 fail · eslint clean.
