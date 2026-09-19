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
