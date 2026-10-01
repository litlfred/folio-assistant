---
name: voice-who-editorial
description: >
  Write and review in the WHO editorial style voice — 9 rules, each citing the publication it was read from.
allowed-tools: Read Grep Glob
---

# WHO editorial style

The house editorial style of the World Health Organization: spelling, capitalization, eponym form, reference layout and non-discriminatory language, as set out in the WHO Editorial Style Manual. Derived rule by rule from the ingested manual; every rule cites the page it was read from.

## What this skill is, against the rules beside it

`voice.json` in this directory carries the RULES — each with the publication,
page and verbatim quote it was read from. **This file does not restate them**,
and a passing `check:voice-skills` depends on that: a rule written here as prose
beside the same rule written there as data is one fact in two places, and the
prose copy is the one carrying no citation and no pattern. To know what the
rules are, read `voice.json`, or run `bun run check:voices`.

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

<!-- SEEDED from this voice's own `title`, `description` and structure when it
     moved to `skills/voices/` (bean `btuv`). Nothing here was invented, and
     nothing here is voice-specific guidance yet: an authoring pass by whoever
     owns this voice is what turns it from correct into useful. -->
