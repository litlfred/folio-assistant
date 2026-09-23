---
# folio-assistant-lnur
title: 'TRANSLATION STATUS VISUALISATION: translations/ is declared but owes a visualiser and a published projection'
status: completed
type: feature
priority: high
created_at: 2026-09-21T21:02:57Z
updated_at: 2026-09-21T23:07:59Z
parent: folio-assistant-bzyu
---

Owner, 2026-09-21: "bean up new epic: need translation status visualtion page, translations/ needs to be a declared sub-graph/dir of cat-harness and is missing its visualtion, json(ld) and such"

## Filed as a FEATURE under the TRANSLATION epic, not as a new epic

Two reasons, and the second is the real one. The store refuses an epic whose
parent is an epic (milestone -> epic -> feature -> task). And `bzyu`
TRANSLATION: the gettext pipeline, translated renders, and their QA already
owns this subject — a second translation epic beside it would split one
subject across two roots, which is exactly what makes a roadmap unreadable.
The owner asked for this to be tracked as real structured work rather than a
one-off, and a feature under the right epic is that.

## ONE HALF OF THE PREMISE IS ALREADY TRUE, and saying so is the point

`translations/` IS a declared sub-graph of cat-harness. `cat-harness.json`
carries it as id `translation-sources`, path `translations/`, graphs
`[translation-sources]`, with `coverage.docs` -> docs/translation-support.md
and `coverage.skill` -> translation-manager. It was undeclared until
2026-09-19 and fixed then — the dh4f defect in reverse, five committed
directories no declaration mentioned.

An epic that opened by re-declaring it would spend its first commit on a
no-op and its second working out why nothing changed.

## WHAT IS ACTUALLY MISSING

1. NO VISUALISER. The coverage entry has `docs` and `skill` and no
   `visualiser`. `kg:audit` already reports it: cat-harness declares 11
   graphs with no published viewer and `translation-sources` is one. Per
   harness-tiles a graph that owes a visualiser owes a TILE, so the missing
   viewer is also a missing tile — one declaration, not a second registry.
2. NO PUBLISHED PROJECTION. No `translations/index.json` the way `todos/`
   and `beans/` have one. Per-page QA sidecars exist and the badges read
   them, but nothing answers "what is the state of the whole translation
   effort" without opening pages one at a time.
3. NO STATUS PAGE — the owner's "translation status visualtion page".

## What exists and must NOT be rebuilt

per-block and per-page QA sidecars and their badge painter (1iyt, g6yr, r3ez,
pp93); `_data/translation-qa-pages.json`, the list of pages WITH a
projection; `content/pipeline/translation-index.ts` and its --check gate; the
sweep badge, already reporting pages-with-translations over total.

The status page is a PROJECTION of those, not a new measurement. A second
count beside the sweep's is the defect this repository names most often.

## Done when

- [x] `translation-sources` declares a `visualiser`, and `kg:audit` stops listing it as owing one
- [x] a published projection exists and the tile opens it
- [x] the page states coverage per locale and verification state, every number derived rather than written down
- [x] could-not-determine is a rendered THIRD state, never folded into zero

## Summary of Changes

`scripts/gen-translation-status.ts` measures the `.pot`/`.po` corpus under the
declared `translation-sources` directory and writes two artefacts:
`docs/assets/translation-status/index.json` (`folio-translation-status/v1`) and
`docs/translation-status/index.html`, rendered server-side with no JavaScript
for the reason `state-visualizer` gives for its own table. `translation:status`
regenerates, `translation:status:check` fails on a stale copy and is registered
in `code-quality-gates.yml` — `d2kp`, a page carrying numbers nobody
regenerated lies by aging.

`cat-harness.json` now declares `coverage.visualiser` on `translation-sources`,
so `kg:audit` no longer lists it as owing a viewer and `harness-tiles`
composes the tile from that one declaration rather than a second registry.

Four things the parse gets right, each with its own fixture in
`scripts/tests/gen-translation-status.test.ts`, because every failure mode here
produces a plausible number rather than an error: the header entry
(`msgid ""`) is metadata and not a string; `#, fuzzy` is counted APART from
translated, since fuzzy entries are exactly the ones a reviewer must look at;
plurals live in `msgstr[n]`, and a parser that knows only `msgstr` marks every
plural entry undone; and emptiness cannot be judged from the keyword's own
line, because a wrapped value has `msgstr ""` with its content beneath.

`share(n, d)` returns `null` on a zero denominator and the page renders that as
a third state rather than as `0%` — "none of 40" is a measurement, "none of 0"
is not. An unreadable catalogue is NAMED rather than folded into zero, for the
same reason.

Measured at first run: 5 locales, 19 catalogues of 318 templates, 392 of 685
strings translated. Those numbers are here as provenance for this turn; the
page derives its own on every run and none of them is written down.
