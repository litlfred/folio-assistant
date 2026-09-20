---
name: domain-fencing
description: >-
  How a domain-specific rule is kept out of the platform without being lost —
  the opt-in axis mechanism, the one criterion that should use it and does not,
  and the test for whether a rule generalizes at all.
capability: architecture
package: graph-management
---

# Domain fencing — keeping one folio's rules out of everybody's platform

> Skill id: `domain-fencing` · Capability: `architecture` · Package: `graph-management`

Detangling a repository and detangling a *rule set* are the same practice. A
platform accumulates rules that were true of one folio, and they are harder to
see than a stray import because nothing fails — the rule simply never fires for
anyone else, or worse, fires wrongly.

## The mechanism already exists and works

`folioOptionalAxes()` in `content/pipeline/qa-criteria-registry.ts`. A folio
opts in through `harness.config.json`:

```json
{ "qaAxes": ["q-usage"] }
```

Without that, the axis's criteria are **absent from the registry** — not
registered-and-skipped, absent. There is nothing to run and nothing to report.

`q-usage-watcher` states its own fencing, and it is the model to copy:

> "**Folio-optional axis.** The `q-usage` criteria encode a substrate
> deformation parameter `q` and its regimes — **one folio's mathematics, not a
> platform concern.** They are registered only when the folio opts in."

It also states the rule that makes fencing necessary rather than merely tidy:

> "the detangler axis. **Don't conflate the two**" — a domain-regime axis and a
> structural axis are different axes, and a node can pass one while failing the
> other.

## The one that should use it and does not

`detangler-archimedean-wall`, in `content/pipeline/qa-criteria-registry.ts`.
It carries **two** independent domain dependencies and its own comment admits
both:

> "Lean. Classifies a block by reading its `.lean` … which a document folio
> cannot have. (Its chapter list is also one folio's directory names — a
> separate, folio-specific defect.)"

So it reads a Lean file *and* hardcodes one folio's six directory names, while
sitting on the platform's structural axis alongside eight criteria that are
genuinely generic.

The generic shell underneath is real — *"a node must live on the side of a
declared partition wall that its content places it on"* — but the wall, the
classifier and the directory list are all irreducibly folio data. **This one
should be re-expressed as declared data and fenced behind an opt-in axis.**

## There is a precedent for exactly that repair

`detangler-topic-coherence` was de-math'd once already. It had a hardcoded
`DETANGLER_CHAPTER_KEYWORDS` table; that table migrated out to a folio-supplied
`topic-keywords.json`, and the criterion stayed. **The mechanism survived, the
data left.** That is the shape of the repair, and it is the same shape as
`repo-partition.ts`'s open problem — roughly 400 of its 1,180 lines are this
repository's exception list inlined into a tool whose algorithm is generic.

## The test for whether a rule generalizes

Three questions, in order, and the first one that answers settles it:

1. **Does the rationale survive translation?** `proof-gap-audit` §J's reasons
   for extracting a shared sub-derivation — *inconsistent edits later, inflated
   graph energy, hiding that the shared thing is worth naming* — are the
   duplicate-module argument word for word. It generalizes.
2. **Is the domain in the mechanism, or only in the vocabulary?**
   `proposition-consolidation-audit` H3 is set-overlap arithmetic with a kind
   list bolted on; strip the list and the rule stands. H2 normalises boxed
   LaTeX with bound-variable renaming and Levenshtein distance — the *shape*
   generalizes, the detection does not.
3. **Would the platform need the domain installed to run it?**
   `lean-completeness-audit` needs Lake, imports, sorries and axioms. No.

A rule that fails all three is not a failure to be fixed. It is a folio's rule,
correctly located, and the honest move is to fence it and say so — which is
what `q-usage-watcher` does in its first paragraph.

## Record the residue, do not quietly drop it

When a rule is lifted, the part left behind is a finding, not waste.
`critical-path-analysis` splits cleanly: its union-of-two-relations model
generalizes and now lives in `edge-kinds-and-blast-radius.md`; its
GENERAL / SPECIALIZED-STATEMENT / SPECIALIZED-PROOF / MIXED taxonomy does not,
and stays where it is.

The taxonomy is also **subsumed** rather than lost — it is the interface-versus-
implementation distinction restated for propositions. Saying so is what keeps a
future reader from lifting it a second time.
