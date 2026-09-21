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
