---
# folio-assistant-rmor
title: 'INJECTION: injectMarkdown deletes EVERY blank line in the document, not the ones it introduced — the written page is structurally destroyed'
status: todo
type: bug
priority: high
created_at: 2026-09-26T12:57:59Z
updated_at: 2026-09-26T12:57:59Z
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

- [ ] a line this function empties is distinguishable from a line the author left
      empty, and only the former is removed
- [ ] a wrapped list item's continuation is removed rather than blanked, so the
      list does not become loose
- [ ] MEASURED AFTER: for every real (catalogue, source) pair in this instance,
      injecting and then re-extracting yields the SAME msgid sequence as extracting
      the source — the identity `f6r1` wanted, once it is achievable
- [ ] MEASURED AFTER: blank-line count is preserved on a document with no
      translations available (the degenerate case must be a no-op)
- [ ] `translation_inject`'s output is looked at by a person once, on a real page,
      because a structural defect of this kind is visible in a second and invisible
      in a passing test

## Ordering

Independent of `lvk9`'s extract half, which is measurable and landing without it.
But `lvk9` makes it MORE pressing rather than less: once a list item is one msgid,
injecting it means writing one translation back over several source lines, which is
exactly the path this defect sits on.
