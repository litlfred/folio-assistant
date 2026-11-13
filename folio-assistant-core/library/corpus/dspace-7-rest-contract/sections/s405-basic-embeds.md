---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s405-basic-embeds
section_title: "Basic embeds"
file: "projections.md"
lines: 55-65
source_sha256: afe6086479eebe16
granularity: heading
---
### Basic embeds

The most basic usage is to specify one level of embeds.
This will allow `core/items/<:uuid>?embed=bundles&embed=owningCollection` to embed the bundles and the owningCollection of the item.

The embed parameters only apply to the current resource.
When using `/api/core/communities/<:uuid>?embed=subcommunities&embed=collections`, it embeds the collections and subcommunities of the current community.
It won't embed the collections and subcommunities of subcommunities.

The supported syntax is `core/items/{uuid}?embed=bundles&embed=owningCollection` or `core/items/{uuid}?embed=bundles,owningCollection`
