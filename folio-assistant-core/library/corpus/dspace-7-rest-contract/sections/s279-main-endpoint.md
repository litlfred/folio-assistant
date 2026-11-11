---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s279-main-endpoint
section_title: "Main Endpoint"
file: "items.md"
lines: 4-12
source_sha256: b326bcd37dfbb1bf
granularity: heading
---
## Main Endpoint
**/api/core/items**   

Provide access to the items (DBMS based). This endpoint is reserved to the administrators the common practice is to navigate to the single items via a discovery [search](search-endpoint.md) or [browse](browses.md).

Currently, this endpoint only returns "archived" items which are NOT withdrawn. However, withdrawn items and Workspace/Workflow items are findable via [search endpoints](search-endpoint.md). Template items are findable via the corresponding collection. In the future, this endpoint is likely to be updated to include all items, regardless of status, see https://github.com/DSpace/DSpace/issues/3325

Example: <https://demo.dspace.org/server/#/server/api/core/items>
