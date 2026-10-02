---
# folio-assistant-lzbw
title: 'IRIS/DSPACE skill: how IRIS uses DSpace and Dublin Core, and what later tools need from it'
status: completed
type: task
priority: high
created_at: 2026-09-20T08:01:40Z
updated_at: 2026-09-20T18:24:21Z
parent: folio-assistant-kupb
---

Owner: 'should be part of skills of iris, how it uses dspace, dublin core, document need for later tools.'

WHAT THE RECORD SHOWS AND A GENERIC DC SCHEMA CANNOT SAY:
- THREE identifier systems, not one. A DSpace UUID (`18892cf3-5a4f-42a4-923c-a93f4a594dec`, in the item URL), a Handle (`10665/332098`), and a WHO govdoc number (`WPR/RDO/2020/003`). The library slug in this repo (`wpr-rdo-2020-003-eng`) is derived from the THIRD, which is the one with no authority behind it. A later tool resolving by slug is resolving by the weakest key.
- A LEGACY handle that still appears in the live record: `10665.1/14518` on `iris.wpro.who.int`. Regional IRIS instances were merged into the global one and both URIs were kept. Deduplication on `dc.identifier.uri` would therefore drop a real alternate identifier.
- MeSH as the subject vocabulary (`dc.subject.mesh`), which is a controlled vocabulary with its own resolution and is not a free-text keyword.
- BITSTREAMS live in BUNDLES ('Original bundle'), so an item is not one file. Size (2.68 MB) and format are per-bitstream metadata.
- COLLECTIONS are the containment hierarchy, and the breadcrumb is a path through communities, not a single parent.

## Done when
`who-iris/skills/` carries the skill, every claim cites the measured record rather than general knowledge about DSpace, and the 'what later tools need' section names each need as a REQUIREMENT a tool can be checked against.

## Closed 2026-09-20 — verified, not assumed

`who-iris/skills/iris-dspace.md` (7.6 KB) carries **R1–R9**, stated as a table
of requirements a tool can be checked against rather than as prose. Each of the
bean's five findings is present and cited to the measured record: three
identifier systems with which is authoritative (R1), the legacy
`10665.1/14518` handle and the never-deduplicate rule (R2), MeSH as a
controlled vocabulary with its authority (R5), bitstreams per bundle (R6), and
containment as paths rather than a parent (R7).

Two requirements the bean did not anticipate, both read off the same record:
R4 (an absent language tag is *unasserted*, never `en`) and R9 (record what the
source says even when it contradicts the file — `dc.description` says `30 p.`,
the PDF has 33 pages).
