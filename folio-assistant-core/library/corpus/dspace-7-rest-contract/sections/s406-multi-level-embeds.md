---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s406-multi-level-embeds
section_title: "Multi-level embeds"
file: "projections.md"
lines: 66-96
source_sha256: afe6086479eebe16
granularity: heading
---
### Multi-level embeds

In case there's a use case to embed sub-resources of a sub-resource, multi-level embeds can be used.

This will allow `/server/api/core/items/<:uuid>?embed=owningCollection/mappedItems/bundles/bitstreams&embed=owningCollection/logo`.
That request will embed:
* The item's owningCollection
* The mappedItems of the item's owningCollection
* The bundles of the mappedItems
* The bitstreams of the bundles of the mappedItems
* The logo of the item's owningCollection

This will **not** embed:
* The bundles of the main item
* The item's mappedCollections
* The owning collection of the mappedItems
* …

The path specified in the embed parameters will be traversed.

It is possible the path contains the same link name multiple times.  
The request `/api/core/communities/<:uuid>?embed=subcommunities/subcommunities&embed=collections` will embed:
* The community's subcommunities
* The subcommunities of the subcommunities
* The community's collections

The request `/api/core/communities/<:uuid>?embed=subcommunities/subcommunities&embed=subcommunities/collections&embed=collections` will embed:
* The community's subcommunities
* The subcommunities of the subcommunities
* The collections of the subcommunities
* The community's collections
