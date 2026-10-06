---
name: voice-who-digital-health
description: >
  Write and review digital health implementation prose in WHO's own vocabulary — 8 rules, each citing the publication it was read from.
allowed-tools: Read Grep Glob
---

# WHO digital health terminology

The controlled vocabulary WHO uses to describe digital health implementations:
what a digital health intervention is against the software that delivers it,
what separates a bottleneck from a health system challenge, and how the two
editions of the classification name themselves — including the first edition's
title, which WHO says was wrong. Derived rule by rule from the ingested
publications in `smart-base/library/`; every rule cites the section it was read
from.

## What this file is, against the rules beside it

`voice.json` in this directory carries the RULES — each with the publication,
section and verbatim quote it was read from. **This file does not restate
them**, and that is not tidiness: a rule written here as prose beside the same
rule written there as data is one fact in two places, and the prose copy is the
one carrying no citation and no pattern. To know what the rules are, read
`voice.json`, or run `bun run check:voices`.

What this file is for is how to USE them.

## Why this voice exists at all

WHO digital health guidance is spread across publications that name the same
things differently, and two of them are in this library under the same title in
different editions. The vocabulary is not a matter of taste — the
classification's own stated purpose is to be *"an accessible and bridging
language"* for planners and stakeholders. A voice is how that stops being an
aspiration in a foreword and becomes something a reviewer can uphold.

## Authoring

**Read the `counterintuitive` rules before you draft, not at review.** They are
where the instinct is wrong, and each carries a `commonError` naming the wrong
instinct:

- the classification's current abbreviation is not the one in wide circulation,
  and the publication itself uses two forms of it
- an intervention is a capability, and naming a product there collapses the
  distinction the classification rests on
- *bottleneck* and *health system challenge* are not synonyms, and DIIG Chapter
  3 is the step that maps one onto the other
- the first edition's title is not merely out of date; WHO calls it incorrect
  and is reissuing under another

A terminology rule is the cheapest to honour and the most tedious to retrofit:
a word changed late ripples into every sentence built around it, and here it
ripples into the classification codes a sentence implies.

## Review and QC

**A finding against this voice is upheld by opening the cited section, never by
trusting the rule's wording.** Every rule names `{ libraryId, sectionId, pages,
quote }` and resolves into `smart-base/library/`; that is what makes the voice
auditable rather than asserted, and it is why `check:voices` refuses a rule
whose citation does not resolve.

That refusal is not theoretical. One of these seven rules failed its own check
on first writing — the quote spanned a mid-word line break in the source, so
the text asserted here was not the text on the page. The rule was correct and
the citation was not, which is precisely the failure a reviewer cannot catch by
reading and the checker catches every time.

If the passage turns out to be a stated exception, or the edition has moved on,
the fix is the rule rather than the prose under review.

## Two things this voice does not do

**It does not police ordinary English.** The rules that prefer one term over
another are scoped to the classification's own groupings, and each says so in
its `context`. Applying a classification term outside the classification is how
a controlled vocabulary becomes a shibboleth.

**It does not adjudicate between the two editions.** Both are in the library
and both are cited. Where they differ the rule says which edition says what,
and the writer chooses knowingly — a voice that silently preferred one would
hide the very change it exists to record. The same restraint applies where a
publication disagrees with WHO's own implementation artefacts: the rule records
both and names which is which, rather than quietly picking the tidier one.
