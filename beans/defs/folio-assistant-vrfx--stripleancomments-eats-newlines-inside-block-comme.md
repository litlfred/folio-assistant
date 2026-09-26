---
# folio-assistant-vrfx
title: stripLeanComments eats newlines inside block comments, so 99% of Lean QA hit lines are wrong
status: todo
type: bug
created_at: 2026-09-25T16:20:52Z
updated_at: 2026-09-25T16:20:52Z
parent: folio-assistant-0lmb
---

Found 2026-09-25 while converging the declaration splitter (`bqrg`). Not part of
that change, and deliberately not folded into it: this one moves a reported
line number on almost every file in a Lean corpus, which is the corpus-wide
re-scoring `bqrg` warns against doing on the strength of an unrelated sweep.

## The defect

`stripLeanComments` blanks a comment by writing a space over each of its
characters — **including the newlines inside a block comment**. Length is
preserved, which is the invariant the module documents and tests. Line count is
not.

```
src:                          stripped:
  1  -- a line comment          1  "                 "
  2  def a := 1                 2  "def a := 1"
  3  /- block                   3  "                      "   <- lines 3-4 became ONE line
  4     comment -/              4  "def b := 2"
  5  def b := 2                 5  ""
```

`def b` is on source line 5 and reports as line 4.

## Why it matters, measured over 3,971 `.lean` files in the qou corpus

| | |
|---|---|
| files whose line count shifts | **3,931 — 99.0%** |
| total lines lost | **281,234** |
| worst single file | `content/unital-groebner-bases/lean/UGB/GrobnerShirshov/HeckeCompletion.lean`, **−3,199 lines** |

`QUsageHit.line` is a number a reader is shown, and
`qa-checkers-q-usage.ts` states the opposite of what happens in its own
docblock:

> Blank Lean comments … while PRESERVING line numbers, so reported hit lines
> stay accurate.

So a hit after any multi-line block comment points a reader at the wrong line,
by up to three thousand of them. A `/-! … -/` module header at the top of a file
shifts *everything* below it.

**This is not the `lean-lexer` byte-offset invariant failing.** That one holds:
`length` is preserved, so `splitDeclarations`' offsets and `leanDeclSpans`'
line numbers are both internally consistent with the stripped text. The bug is
in the translation from stripped-text lines back to SOURCE lines, which is the
only thing a reader cares about.

## The fix looks like one character

Write `\n` rather than `" "` when the character being blanked is a newline.
Length is still preserved (one char for one char) and line count becomes
preserved too. Safe against the obvious objection: the comment's *content* is
still blanked, so a restored newline only ever yields a line of spaces, and no
declaration pattern can match one.

## Done when

- [ ] a block comment spanning N lines leaves N lines in the stripped output,
      with length still equal
- [ ] `lean-lexer-is-the-only-stripper.test.ts` gains the line-count invariant
      beside the length one — it asserts only length today, which is why this
      survived
- [ ] the false claim in `qa-checkers-q-usage.ts`'s docblock is either true or
      gone
- [ ] MEASURED AFTER: the shift is gone on a re-sweep of the corpus, and the
      **change in reported hit lines** is stated in the PR rather than shipped
      quietly — every existing Lean QA sidecar's line numbers move

## Not in scope

The other five modules carrying their own Lean declaration pattern
(`conjectural-propagation-audit`, `generate-lean-stubs`,
`proof-narrative-lean-equiv-sweep`, `qa-utils`, `lean-coverage`) — that is
`bqrg`'s ground, and `lean-decl-starts-are-shared.test.ts` ratchets the list so
it can only shrink.

