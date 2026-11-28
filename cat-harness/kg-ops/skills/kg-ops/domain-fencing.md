---
name: domain-fencing
description: >-
  How a domain-specific rule is kept out of the platform without being lost —
  the opt-in axis mechanism, why a profile is not a fence, and the test for
  whether a rule generalizes at all.
---

# Domain fencing — keeping one folio's rules out of everybody's platform

> Skill id: `domain-fencing` · Package: `graph-management`

Detangling a repository and detangling a *rule set* are the same practice. A
rule that is true of one folio is harder to see than a stray import because
nothing fails: it never fires for anyone else, or fires wrongly.

## The mechanism: an opt-in axis

`folioOptionalAxes()` in `pipeline/qa-criteria-registry.ts`. A folio opts in
through its config, inline in its `index.config.json` entry:

```json
{ "qaAxes": ["q-usage"] }
```

Without that, the axis's criteria are **absent from the registry** — not
registered-and-skipped, absent. There is nothing to run and nothing to report.

The `q-usage` watcher states its own fencing, and it is the model to copy:

> "**Folio-optional axis.** The `q-usage` criteria encode a substrate
> deformation parameter `q` and its regimes — **one folio's mathematics, not a
> platform concern.** They are registered only when the folio opts in."

A domain-regime axis and a structural axis are different axes, and a node can
pass one while failing the other. Do not conflate them.

## A profile is not a fence

`detangler-archimedean-wall` and the four `wall` criteria (`wall-side-correct`,
`wall-base-ring-minimal`, `wall-side-statement`, `wall-side-proof`) are fenced
behind `qaAxes: ["archimedean-wall"]`, because they read a `.lean` file and
name one folio's chapters — one folio's mathematics, not a platform concern.

**`profiles: ["paper"]` is not a fence.** A profile says what KIND of folio can
answer the question. It does not say WHOSE question it is. Every paper folio has
a `.lean` to read, so a profile alone admits all of them to a criterion about
one folio's chapters. A domain rule needs an opt-in axis even when it already
carries a profile: the two restrict different things.

**One axis per domain, not one per criterion.** The five wall criteria open
together on `archimedean-wall`, so a folio adds one key and cannot end up
half-fenced. A single domain criterion inside an otherwise-generic axis is
fenced by a conditional spread of a one-element array, not a gated domain.

**Gate the registry and the watcher bucket together.** A bucket built from an
unfenced array names a criterion the registry never registered — a watcher axis
reporting on nothing and looking clean. `WATCHER_CRITERIA_BY_AXIS` and
`DETANGLER_WATCHER_CRITERIA` both spread conditionally.

**Discovery is registry-driven.** A fenced axis's checkers are not discovered
when the axis is closed, so fencing does not strand them as orphans.

**Direct callers keep working, and should.** `q-usage-audit.ts` calls
`checkWallSide` and `checkBaseRingMinimal` by function, not through the
registry. Fencing governs what the **platform asserts every folio must be
measured against**; a **folio's own audit** may compute what it likes, having
already decided the wall applies.

| | `wall` in registry | in the one-voice bucket | wall checkers discovered |
|---|---|---|---|
| no `qaAxes` | 0 | 0 | none |
| `qaAxes: ["archimedean-wall"]` | 4 | 4 | `wall-side-correct`, `wall-base-ring-minimal` |

**Verify against a synthetic folio root, in a subprocess.** The registry reads
its config ONCE at module load, so OFF and ON are not both observable in one
process. `scripts/tests/folio-optional-axes.test.ts` does this and pins both
states; removing the conditional spread turns it red.

## The shape of the repair: the mechanism stays, the data leaves

`detangler-topic-coherence` had a hardcoded `DETANGLER_CHAPTER_KEYWORDS` table;
the table moved out to a folio-supplied `topic-keywords.json`, and the criterion
stayed. `repo-partition.ts` has the same open problem: roughly 400 of its 1,180
lines are one repository's exception list inlined into a generic algorithm.

## The test for whether a rule generalizes

The examples are drawn from the science layer's audits, described here rather
than named; that layer links this skill from its side.

Three questions, in order, and the first one that answers settles it:

1. **Does the rationale survive translation?** A proof-gap audit's reasons
   for extracting a shared sub-derivation — *inconsistent edits later, inflated
   graph energy, hiding that the shared thing is worth naming* — are the
   duplicate-module argument word for word. It generalizes.
2. **Is the domain in the mechanism, or only in the vocabulary?**
   A proposition-consolidation audit's overlap rule is set-overlap arithmetic
   with a kind list bolted on; strip the list and the rule stands. Its
   near-duplicate rule normalises boxed LaTeX with bound-variable renaming and
   Levenshtein distance — the *shape* generalizes, the detection does not.
3. **Would the platform need the domain installed to run it?**
   A Lean completeness audit needs Lake, imports, sorries and axioms. No.

A rule that fails all three is a folio's rule, correctly located: fence it and
say so.

## Record the residue, do not quietly drop it

When a rule is lifted, the part left behind is a finding, not waste. A
critical-path analysis splits cleanly: its union-of-two-relations model
generalizes and lives in `edge-kinds-and-blast-radius.md`; its
GENERAL / SPECIALIZED-STATEMENT / SPECIALIZED-PROOF / MIXED taxonomy does not,
and stays where it is. The taxonomy is the interface-versus-implementation
distinction restated for propositions; saying so keeps a future reader from
lifting it a second time.
