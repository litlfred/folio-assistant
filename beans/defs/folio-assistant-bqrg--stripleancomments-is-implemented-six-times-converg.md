---
# folio-assistant-bqrg
title: stripLeanComments is implemented six times — converge on lean-lexer.ts
status: todo
type: task
created_at: 2026-09-18T22:52:21Z
updated_at: 2026-09-18T22:52:21Z
parent: folio-assistant-0lmb
---


## Measured 2026-09-18, on `claude/festive-galileo-s7ibx0`

```
grep -rn "stripLeanComments" --include=*.ts . | grep -v node_modules
```

Six independent implementations of a Lean comment stripper:

| file | line | shape |
|---|---|---|
| `content/pipeline/lean-lexer.ts` | 23 | **canonical** — extracted this session from `lean-atlas-ingest.ts` |
| `content/pipeline/qa-checkers-extended.ts` | 2925 | a local `const` inside a checker |
| `content/pipeline/qa-checkers-vacuity.ts` | 490 | a module-level `function`, used three times |
| `content/pipeline/conditional-class-banner-audit.ts` | 111 | a module-level `function` |
| `content/pipeline/qa-checkers-q-usage.ts` | 138 | a module-level `function`, plus its own `leanDeclSpans` |
| `scripts/lean-coverage.ts` | 177 | a module-level `function`, used twice |

`qa-checkers-q-usage.ts` also carries its own `leanDeclSpans` beside
`lean-lexer`'s `splitDeclarations`, so the *declaration splitter* has at least
two implementations as well.

## Why it matters, specifically

The canonical version's own doc comment states two invariants that a
reimplementation is unlikely to reproduce, and that nothing checks:

1. **Byte offsets are preserved.** Comment bodies are replaced with
   equal-length whitespace, because `splitDeclarations` indexes into the
   result and must stay aligned with the original source. A copy that simply
   deletes comments silently misaligns every span it feeds.
2. **Doc comments (`/-- … -/`) are comments.** A declaration name that appears
   only in prose is not a dependency; the canonical comment notes that skipping
   this is "how a scanner invents edges out of documentation".

Plus nested `/- … -/`, which the canonical one tracks with a depth counter.

## Why it was NOT done in the same change

Each copy feeds a QA checker, so a behavioural difference is a corpus-wide
re-sweep and a changed verdict on merged content. Some differences may be
deliberate — `qa-checkers-q-usage`'s, for instance, sits beside its own span
splitter and may rely on its exact output. Converging them blind is how a
"cleanup" becomes a silent re-scoring.

## Done when

Each of the five is either:

- **replaced** by `lean-lexer`'s, with the before/after verdicts compared on a
  real corpus and reported (not asserted); or
- **kept**, with a comment beside it saying what it does differently and why
  the canonical one will not do — which is a real answer, and the one that
  stops the next agent re-opening this.

A third state is expected and must not be collapsed into either: **no corpus
to compare against**. The platform carries no folio, so "the verdicts are
unchanged" is not checkable from this repo alone and must not be reported as
though it were.

## Context

Found while draining `content/pipeline/lean-signature.ts` → `lean-atlas-ingest.ts`,
the last of the core→sci edges in the repository-partition work. Extracting the
lexer to `content/pipeline/lean-lexer.ts` (classified core, by the same test as
`schemas/lean-packages.ts`) drained that edge and gave the five copies one home
to converge on.

## DONE 2026-09-20 — all five converged, with the corpus evidence this bean demanded

The bean warned that converging blind is how a cleanup becomes a silent
re-scoring, and named a third state — **no corpus to compare against** — that
must not be collapsed. There IS a corpus: qou's **3,954** `.lean` files, read
as test data.

### The comparison that mattered, and the one that did not

Raw output was the wrong axis: canonical BLANKS comments to preserve byte
offsets while every copy DELETED them, so raw output differed on 3,947 of
3,954 files — a design difference, not a behavioural one. Comparing the
**identifier set** each produced is what a downstream checker actually sees:

    impl        same token set   differs   verdict
    extended         3954           0      equivalent — depth counter
    coverage         3954           0      equivalent — depth counter
    vacuity          3950           4      NOT equivalent
    banner           3950           4      NOT equivalent
    qusage           3950           4      NOT equivalent

So this was never "five copies of one function". Two were faithful
reimplementations; **three were broken**.

### The defect in the three

All three used `/\/-[\s\S]*?-\//g`, which is non-greedy and matches to the
FIRST `-/`. Lean nests block comments, so an outer comment ends early and its
tail reaches the checker as code. Measured on
`confined-particle.lean` (nesting depth 2): **113 prose tokens** leaked —
`def`, `Prop`, `fun`, `True`, and English words including "docstring" and
"about" — into text three QA checkers scan for declarations. That is exactly
what `lean-lexer`'s own header warns of: *"how a scanner invents edges out of
documentation."*

### Before/after, REPORTED not asserted

Four files in the corpus strip differently now:

     113 tokens   knots-particles-confinement/confined-particle.lean
     117 tokens   lean/QOU/Interactions/AlgebraicPrimality.lean
      60 tokens   lean/QOU/HeckeAlgebra/JonesMarkovWenzl.lean
     328 tokens   scripts/lean/probes/prop-field-carrier-vacuity.lean

In every case the change REMOVES prose that was being read as code. Whether
any verdict flips is qou's to observe — this repository carries no folio, and
asserting "verdicts unchanged" from here is the thing the bean forbids. The
four files and the token counts are the handover.

### What landed

Five definitions deleted; all five sites import `lean-lexer`'s. One
implementation remains repo-wide. `check:partition` passes — `lean-lexer` is
core and `scripts/lean-coverage.ts` may import it.

7 tests, ratchet falsified (reintroducing a copy fails 1), plus the three
invariants a reimplementation kept losing: byte offsets preserved, nested
`/- /- -/ -/` closing in the right place, and doc comments counting as
comments.

### `leanDeclSpans` is NOT done

The bean also noted `qa-checkers-q-usage` carries its own declaration splitter
beside `lean-lexer`'s `splitDeclarations`. Untouched here — a span splitter's
output feeds offsets rather than a token set, so the same differential method
needs a different comparison, and bundling it would have made one change two.
