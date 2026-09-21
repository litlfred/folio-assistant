---
# folio-assistant-jmpb
title: 'The exported graph is English-only: no .jsonld is built per locale, so translated labels reach no consumer of the data'
status: todo
type: task
priority: normal
created_at: 2026-09-21T22:03:22Z
updated_at: 2026-09-21T22:03:40Z
parent: folio-assistant-bzyu
---


Owner, 2026-09-21, while `j28g` was being worked:

> but we should also build the json/jsonld for the rendered result of the
> translations. no reason that is english only

## The gap, measured

`kg-export.ts` contains **one** occurrence of the string `locale`. The graph
it writes carries labels and documentation in whatever language the source
asset was authored in — English throughout this corpus — and there is no
per-locale artefact beside it.

So the translation pipeline currently ends at the RENDERED PAGE. A `.po` is
injected into a diagram and an SVG is rendered per locale, but the graph a
machine consumes is produced once, in English. Every translated string this
repository holds is invisible to anything reading the data rather than the
picture.

That matters more after 2026-09-21 than before it: 157 swimlane
`<bpmn:documentation>` strings landed that day (bean `sqtq`), extracted to
every locale's catalogue. They are the DEFINITIONS #596's glossary reads. A
glossary built from the exported graph would therefore be English-only by
construction, however much of it a translator had finished.

## Not the same as `xcyh`

`xcyh` ("The KG viewer must be translated") is about the viewer's own chrome —
the labels around the graph. This is about the graph itself. A fully
translated viewer rendering an English-only payload is still an English-only
answer to "what does this term mean".

## Questions this has to settle, and none is obvious

- **One document per locale, or one document carrying language maps?** JSON-LD
  supports `@language` and language maps natively, so a single artefact could
  carry every locale — at the cost of size on every consumer that wants one.
  Per-locale files are simpler to serve and cacheable, at the cost of N
  artefacts and N staleness checks.
- **What is the IRI of a translated node?** It must be the SAME node — a
  translation is not a new term. That points at language maps or at per-locale
  documents whose `@id`s are identical, never at locale-suffixed IRIs.
- **An untranslated string: absent, or the source falling through?** Absent is
  honest and makes coverage measurable; falling through is friendlier and
  hides how little is translated. This repository's habit is the former, said
  out loud.

## Done when

- [ ] the exported graph is available in every locale that has catalogues
- [ ] a translated node keeps its IRI — the same term, not a new one
- [ ] an untranslated string has ONE declared behaviour, stated rather than
      incidental
- [ ] staleness is checked per locale, so a stale translated export cannot
      look like a current one

## Investigated 2026-09-21 — two of the three questions are already answered

Read rather than reasoned about, before asking the owner anything.

### Q3, "an untranslated string: absent, or the source falling through?" — ANSWERED

`parsePo` in `content/pipeline/po-inject.ts` includes **only entries with a
non-empty `msgstr`**, and skips fuzzy entries, with the reason on the function:
*"to avoid injecting uncertain translations."* So an untranslated string is
simply absent from the map and the source stays — **falling through, already,
deliberately, everywhere translation happens here.**

This bean framed it as an open choice and argued absence was the more honest
option. That was wrong to frame as open: the corpus settled it, and a second
answer in the exported graph would mean a string that falls through in the
rendered diagram and vanishes in the data describing the same diagram.

### Q2, "what is the IRI of a translated node?" — NOT REALLY A QUESTION

A translation is not a new term, so the node keeps its `@id`. The bean already
said this; what it adds is that the constraint RULES OUT locale-suffixed IRIs
rather than choosing between the two remaining shapes.

### Q1, "per-locale documents or language maps?" — GENUINELY OPEN

And the repository has precedent for **both**, which is why it cannot be
looked up:

| pattern | where it already exists | what it does |
|---|---|---|
| a translated COPY per locale | `injectBpmn` — `translate-bpmn --inject` writes `translations/<locale>/workflows/<stem>.bpmn` | one artefact per locale |
| every catalogue in ONE artefact | `translate-kg-viewer` — its own header: *"generating the page IS the injection"*, embedding every locale's `.po` in the single page it emits | one artefact, all languages |

One measurement tips it: **the published `@context` binds no `@language`.**
Grepping `schemas/jsonld.ts` for `@language` returns nothing. Language maps
are native JSON-LD and would need that binding added; per-locale documents
need none.

That matters here more than elsewhere, because this repository has already
paid for a prefix bound in the context and emitted by nothing — `fd6i`, where
`skos:` sat declared and unused while prose claimed the graph "speaks eight
published vocabularies". Adding `@language` to serve an artefact nobody has
built yet would be the same shape.

`cat-harness/docs/ar/` also exists, so per-locale OUTPUT is not a new idea on
the site side either.

**Recommended: per-locale documents.** Cost, stated plainly: N artefacts and N
staleness checks rather than one of each. The honest counter is that a
consumer wanting two languages fetches twice, and that language maps are the
thing JSON-LD was designed for — which is why this goes to the owner rather
than being decided here.

## RULED 2026-09-21 — one document per locale, and the core graph stays clean

Owner:

> hmm, i want to preserve tightness of bootrstrap, so we need to make sure no
> references to translatiosn from core grpah. we do one document per-locale.

Two decisions, and the second is the one that would have been got wrong by
default.

### One document per locale

As recommended. No `@language` added to the published `@context`, no language
maps. Same `@id` on every node, because a translation is not a new term.

### THE CORE GRAPH MUST NOT REFERENCE ITS TRANSLATIONS

The obvious implementation adds a pointer — `hasTranslation`, an
`availableLocales` array, a `seeAlso` per locale — from each node to its
translated forms. **That is refused.** The core graph would then carry an edge
per locale per node, growing with the translation effort, and bootstrap's
graph would gain references to artefacts it does not own and cannot validate.

So the arrow runs ONE WAY: a per-locale document references the core graph,
never the reverse. A translated document is a projection OF the core, and the
core is complete without any of them existing — the same relation
`board-diagram-interchange` already states for a board and its folio, where
*"the folio carries what is true, the layout layer carries where it was
drawn, and the arrow runs folio → board → position → note and never back."*

**What this rules out, concretely**, so the next agent does not rediscover it
by writing one:

- no `availableLocales` / `hasTranslation` / `translationOf` property ON a
  core node
- no per-locale `@id`s in the core document
- no locale key in the core graph's `@context`

**What discovers the translations instead** is the same thing that discovers
them everywhere else here: the filesystem, through `availableLocales()` in
`po-resolve.ts`, which resolves `translations/<locale>/<stem>.po`. A consumer
asking "which languages is this graph in" asks the directory, exactly as the
language bar and coverage badge already do.

## Done when — revised

- [ ] one `.jsonld` per locale that has catalogues, node `@id`s unchanged
- [ ] an untranslated string falls through to the source, as `parsePo`
      already does everywhere else — not a second answer in the data
- [ ] **the core graph carries NO reference to any translation** — checked,
      not merely intended
- [ ] staleness is checked per locale, so a stale translated export cannot
      look like a current one
