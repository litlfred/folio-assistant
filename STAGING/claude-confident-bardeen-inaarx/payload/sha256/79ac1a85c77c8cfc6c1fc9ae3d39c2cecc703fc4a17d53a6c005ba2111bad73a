---
# folio-assistant-rmor
title: 'INJECTION: injectMarkdown deletes EVERY blank line in the document, not the ones it introduced — the written page is structurally destroyed'
status: completed
type: bug
priority: high
created_at: 2026-09-26T12:57:59Z
updated_at: 2026-09-27T06:40:21Z
parent: folio-assistant-bzyu
---

Found 2026-09-26 while doing `lvk9`. Pre-existing, and the most damaging thing in
this family so far.

`injectMarkdown` ends with:

```ts
// Remove blank lines introduced by paragraph collapse
const result = outLines.filter((line) => line !== "").join("\n");
```

The comment says *"introduced by paragraph collapse"*. The code removes **every
empty line in the document**, including every one the author wrote.

## Measured, on five lines of markdown

    source:   "# Title\n\nFirst paragraph here.\n\n- item one\n- item two\n\nSecond paragraph here."
    injected: "# Titre\nFirst paragraph here.\n- item one\n- item two\nSecond paragraph here."

    blank lines in source: 3    in output: 0

The heading runs into the paragraph, the paragraph runs into the list, and the
trailing paragraph is absorbed by the list. **In markdown that is a different
document.**

## It reaches disk

`src/tools/translation.ts:157` calls `injectMarkdown` and writes
`result.translated` to `translations/<locale>/<basename>`. So the
`translation_inject` MCP tool cannot currently produce a usable translated page —
its output is structurally destroyed for any document with more than one block.

**No live damage that I can find**, and that is luck rather than design: the
published pages under `docs/<locale>/` all carry proper blank lines, so they were
authored by translating the source rather than by this tool. The tool is broken
and unused; nothing says so, which is `xom7`'s shape — a thing that fails exactly
like a thing that works, from the outside.

## Why blanking was the wrong mechanism in the first place

`flushParagraph` writes the translation onto the first line of a wrapped paragraph
and sets the continuation lines to `""`, then this filter sweeps them. The sweep
cannot tell those from real blank lines, so it takes both.

It also breaks a LIST: a blank line inside a list item makes a loose list, so
blanking a wrapped item's continuation changes rendering even before the global
filter runs. A sentinel the filter can recognise, or splicing the array, is what
this needs — the mechanism has to distinguish "a line this function emptied" from
"a line the author left empty", and a value of `""` cannot carry that.

## This is why `f6r1`'s round-trip control failed

`f6r1` found its inject→re-extract identity check failing on **known-good**
catalogues and correctly concluded the criterion was useless as a test of a
catalogue. Cause, now measured: re-extraction cannot agree with the original when
every paragraph boundary in the document has been deleted.

## Done when

- [x] a line this function empties is distinguishable from a line the author left
      empty, and only the former is removed
- [x] a wrapped list item's continuation is removed rather than blanked, so the
      list does not become loose
- [x] MEASURED AFTER: for every real (catalogue, source) pair in this instance,
      injecting and then re-extracting yields the SAME msgid sequence as extracting
      the source — the identity `f6r1` wanted, once it is achievable
- [x] MEASURED AFTER: blank-line count is preserved on a document with no
      translations available (the degenerate case must be a no-op)
- [x] `translation_inject`'s output is looked at by a person once, on a real page,
      because a structural defect of this kind is visible in a second and invisible
      in a passing test

## Ordering

Independent of `lvk9`'s extract half, which is measurable and landing without it.
But `lvk9` makes it MORE pressing rather than less: once a list item is one msgid,
injecting it means writing one translation back over several source lines, which is
exactly the path this defect sits on.

_2026-09-27T06:26:13Z_ — Claimed by claude/wonderful-gauss-7frcrw — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Fixed 2026-09-27

**The mechanism, not the symptom.** The bean offered "a sentinel the filter can
recognise, or splicing the array". Neither as written: a sentinel string would owe
a proof that no markdown line can equal it, and a `Set<number>` of the indices
`flushParagraph` collapsed owes nothing. One `filter((_, idx) =>
!collapsed.has(idx))` at the end replaces
`filter((line) => line !== "")`, and `flushParagraph` records an index instead of
writing `""`.

Reproduced first on the bean's own fixture: 3 blank lines in, 0 out. After: 3 in,
3 out, heading still translated.

## Measured over the real corpus

| | |
|---|---|
| (catalogue, source) pairs injected | 62 |
| pairs where the blank-line count differs | **0** |
| pairs where a paragraph still collapsed | **62** |
| blank lines the OLD filter would have destroyed across those pairs | **3871** |

The second row and the third are both required. A "fix" that preserved blank
lines by not collapsing at all would give 0 differences and silently remove the
feature, so the corpus test asserts `collapsed === pairs` as well.

## The two defects were INTERACTING, and that is new

This bean recorded the loose-list problem as a second consequence of blanking. It
is — and the two hid each other. Measured with blanking kept and the global filter
removed, on `- an item / continued line one / continued line two / - second item`:

    "- an item\nsuite traduite\n\n- second item"

A blank line inside the list, which makes it loose. **With both defects present
the final output is correct**, because the global filter swept that blank away
along with all the others. So fixing only the filter would have EXPOSED the list
damage rather than fixed it, and fixing only the blanking would have left every
author's blank line destroyed. One mechanism change removes both.

The test for it says in its own body that it does not discriminate against the old
code as a whole, and why: what it guards is the obvious half-repair.

## Falsified by breaking

The fix was reverted and the tests re-run: 3 of the 5 new tests go red (the
fixture, the byte-for-byte no-op, and the corpus invariant). The other two guard
the opposite direction and the half-repair, and pass either way by design — said
in the test rather than left for a reader to discover.

bun test 12181 pass 0 fail; tsc clean; eslint 0 errors; all 161 gates the
`gates` job runs, extracted from the workflow and run individually, 0 failures.

**Not done:** nothing was re-injected over any real page. The tool is now
correct; whether to regenerate anything with it is a separate decision under #206.
