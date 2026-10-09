---
# folio-assistant-7eak
title: 'Dublin Core renderings: DC XML + JSON(-LD) per record, as a skill and tool in the rendering pipeline, published to gh-pages; who-iris links to both'
status: completed
type: task
priority: normal
created_at: 2026-09-30T08:54:51Z
updated_at: 2026-10-09T17:42:54Z
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

- [x] A skill in cat-harness says which records get a DC rendering, which DC XML form (oai_dc vs qualified DC), and how each field maps from the node's own data (never composed).
- [x] A Tool node + script renders DC XML and the JSON(-LD) form for each such record, deterministically, with a `--check`.
- [x] The docs-site pipeline publishes both beside the record's page on gh-pages.
- [x] who-iris's pages link each record to its JSON and XML renderings.
- [x] A gate fails when a record that should have a rendering lacks one, or a rendering is stale.

## Not now

Owner: keep the primary focus on the bootstrap / bootstrap-tools staging separation (bean `xsqm`). This is queued, not started.

## Claim

Claimed by claude/dublin-core-renderings (session https://claude.ai/code/session_01CVVoavPoCHMLA7AASxG8cH). Issue #1840.


## Closed 2026-10-09 on landed evidence (session https://claude.ai/code/session_01BJNRo4kh8U15HZVFDhYNJL; evidence, not authorship)
Every Done-when item is in the repositories today:
1. Skill: `folio-assistant-core/skills/library/catalogue/dublin-core-renderings.md` (folio-assistant-core after the split, not cat-harness).
2. Tool + script with `--check`: Tool node `dublin-core-render` in `folio-assistant-core/tools/index.ts`; `folio-assistant-core/scripts/dc-render.ts` (qualified DC XML + DCMI-Terms JSON-LD, deterministic).
3. Published: litlfred/who-iris `site/dublin-core/<stem>.dc.xml|.dc.jsonld`, beside the item pages, which the mount copies whole.
4. who-iris links both: item pages carry `href="dublin-core/<stem>.dc.xml"` and `.dc.jsonld` (e.g. item-item-63e14c27… → 9789241548960-eng).
5. Gate: `bun run cat dc:render:check` in folio-assistant's code-quality-gates.yml.
The 2026-09-30 claim (branch claude/dublin-core-renderings, still on the remote) was not released by its holder; the work it announced has landed, so the claim is moot.
