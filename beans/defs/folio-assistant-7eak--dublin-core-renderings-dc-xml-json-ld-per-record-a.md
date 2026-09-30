---
# folio-assistant-7eak
title: 'Dublin Core renderings: DC XML + JSON(-LD) per record, as a skill and tool in the rendering pipeline, published to gh-pages; who-iris links to both'
status: todo
type: task
created_at: 2026-09-30T08:54:51Z
updated_at: 2026-09-30T08:54:51Z
parent: folio-assistant-7deg
---

## The ask, owner 2026-09-30 (verbatim)

> do we render the proper xml for dublin core?  it should be in rendering ppiple as skill and tool.   i tihnk.  and then pushed to gh-pages
> that is in cat-harness... bean up for now
> (and who-iris should link to json and xml renderings)

## What is true today (measured 2026-09-30, not yet investigated in depth)

- Dublin Core terms are used as JSON-LD predicates (`dcterms:*` — e.g. `dcterms:isReplacedBy`, `dcterms:requires`, `dcterms:source` in the glossary export). No step renders a record as **Dublin Core XML** (the `oai_dc` / `dc:` XML form a catalogue harvester reads), and nothing publishes one to gh-pages.
- Bean `7deg` (parent) introduces Dublin Core in folio-assistant-core; it does not cover rendering or publication.

## Done when

- [ ] A skill in cat-harness says which records get a DC rendering, which DC XML form (oai_dc vs qualified DC), and how each field maps from the node's own data (never composed).
- [ ] A Tool node + script renders DC XML and the JSON(-LD) form for each such record, deterministically, with a `--check`.
- [ ] The docs-site pipeline publishes both beside the record's page on gh-pages.
- [ ] who-iris's pages link each record to its JSON and XML renderings.
- [ ] A gate fails when a record that should have a rendering lacks one, or a rendering is stale.

## Not now

Owner: keep the primary focus on the bootstrap / bootstrap-tools staging separation (bean `xsqm`). This is queued, not started.
