---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s066-multiple-bitstreams-delete
section_title: "Multiple Bitstreams Delete"
file: "bitstreams.md"
lines: 163-189
source_sha256: 105bbe2f88adcbdf
granularity: heading
---
### Multiple Bitstreams Delete
Delete a list of Bitstreams in one request. This will work for any list of Bitstreams that are attached to an item, will mostly be used in the item admin edit

* 204 No content - if the operation succeeded
* 401 Unauthorized -  if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if any of the bitstreams in the list haven't been found or are already deleted
* 422 Unprocessable Entity - If one or more of the given Bitstreams aren't attached to an Item.

A sample CURL command would be:
```
curl -i -X PATCH 'https://demo7.dspace.org/server/api/core/bitstreams -H 'Authorization: Bearer eyJhbGciO…' -H "content-type: application/json" --data '[ { "op": "remove", "path": "/bitstreams/12623672-25a9-4df2-ab36-699c4c240c7e"}, { "op": "remove", "path": "/bitstreams/5a3f7c7a-d3df-419c-8a2-f00ede62c60a"}]'
```

The Patch contents is:
```json
[
  {
    "op": "remove",
    "path": "/bitstreams/12623672-25a9-4df2-ab36-699c4c240c7e"
  },
  {
    "op": "remove",
    "path": "/bitstreams/5a3f7c7a-d3df-419c-8a2-f00ede62c60a"
  }
]
```
