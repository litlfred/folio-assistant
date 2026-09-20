---
# folio-assistant-lzbw
title: 'IRIS/DSPACE skill: how IRIS uses DSpace and Dublin Core, and what later tools need from it'
status: todo
type: task
priority: high
created_at: 2026-09-20T08:01:40Z
updated_at: 2026-09-20T08:01:40Z
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
