---
name: devils-advocate-paper
description: >-
  What the harness's devils-advocate-watcher means for a paper folio: its
  claim-bearing kinds and formal tree, the Lean vacuity shapes the Formalist
  lens looks for, and the paper watchers the adversary sits beside.
---

# Devil's advocate on a paper folio

The harness skill `devils-advocate-watcher` (`skill_fetch
devils-advocate-watcher`) attacks any content type's claims. It leaves three
things to the content type. This is what they are for a paper folio with a
Lean formal layer.

## Slot B and Slot G patterns

```bash
# Claim-bearing kinds. Slot B's trigger also counts remarks and examples;
# Slot G's backlog takes the auditable subset.
KINDS='theorem|lemma|proposition|corollary|conjecture|definition|remark|example'
KINDS_BACKLOG='theorem|lemma|proposition|corollary|conjecture|definition'

# Formal-layer siblings under a paper's formal tree.
FORMAL='content/.*/(lean|formal)/.*\.(lean|v|thy)$'
```

Slot H's ranking puts provable kinds before definitions before conjectures: a
`theorem` carries a truth claim a referee can falsify; a `conjecture` already
admits it is unproved. A `conj:` label is the paper's admitted-open kind.

## Vacuity shapes in Lean

The Formalist lens (L1) asks whether `F(B)` proves `S(B)` or something weaker.
In Lean, the vacuous shapes are:

- `: True := trivial`, a statement that says nothing;
- a self-assuming projection (`:= ctx.claim`);
- a decision-procedure mask, where a tactic closes a goal that no longer
  states the claim.

A `da-vacuous` `: True` stub that should resolve to a real library
declaration is an auto-discharge (Slot E). The status-label overclaim
pre-filter treats `:True` and `:=trivial` as non-closure signals.

A `structural`-scope refutation cites a proved invariant: for mathematics, a
parity or sign, a dimension, degree or count bound, a formally proved
impossibility, or an entropy or precision bound.

## The paper watchers the adversary sits beside

| Sibling | They check | The adversary additionally asks |
|---------|-----------|----------------------------------|
| `proof-integration-watcher` | no bare gaps, no axiom growth, formal layer compiles | *is the thing it proves the thing it claims, and is the claim even true?* |
| `compute-integration-watcher` | every statement has a probe + consumer | *does the probe actually support the claim, or just co-vary with it?* |
| `proof-narrative-lean-equivalence` | formal ≟ narrative (equivalence) | *if they diverge, which one is the overclaim?* |

The watcher never edits the math to make an objection go away: any change to
a statement, a proof or a number is Author-assist.
