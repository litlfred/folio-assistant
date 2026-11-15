---
name: voice-milnor
description: >
  Write and review in the Milnor exposition standard voice — 12 rules, each citing the publication it was read from.
allowed-tools: Read Grep Glob
---

# Milnor exposition standard

The voice derived from John Milnor's "Link Groups" (Annals of Mathematics 59(2), 1954, pp. 177-195): every rule cites a page of the paper, and three exist because the paper contradicts the house voice. The scoring rubric (eight hallmarks, 0-2 each, sixteen to pass) is `milnor-exposition-standard`.

## What this skill is, against the rules beside it

`voice.json` in this directory carries the RULES — each with the publication,
page and verbatim quote it was read from. **This file does not restate them**;
`check:voice-skills` fails if it does. To know what the rules are, read
`voice.json`, or run `bun run cat check:voices`.

What this file is for is how to USE them.

## Authoring

Read the rules flagged `counterintuitive` before you draft, not at review. Those
are the ones where the instinct is wrong, and they carry a `commonError` saying
what the wrong instinct is. A terminology rule is the cheapest to honour and the
most tedious to retrofit — a word changed late ripples into every sentence built
around it.

## Review and QC

A finding against this voice is upheld by **opening the cited page**, never by
trusting the rule's wording. Every rule names `{ libraryId, sectionId, pages }`
and quotes the text it was derived from; that is what makes the voice auditable
rather than asserted, and it is why `check:voices` refuses a rule whose citation
does not resolve.

If the passage is a stated exception, or the rule is out of scope for the genre
of that block, say so on the finding rather than rewriting the prose.

## QA

The mechanical half runs from the rules' `patterns` and `terminology`. A rule
marked `judgementOnly` has no lexical check by design — "nobody has written the
pattern yet" and "no pattern could work" are different states, and only the
second is a finished rule. The overlay criterion derived from this voice carries
its `overlaySeverity`.
