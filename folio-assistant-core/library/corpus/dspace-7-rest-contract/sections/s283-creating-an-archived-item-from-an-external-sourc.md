---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s283-creating-an-archived-item-from-an-external-sourc
section_title: "Creating an archived item from an external source"
file: "items.md"
lines: 165-180
source_sha256: b326bcd37dfbb1bf
granularity: heading
---
### Creating an archived item from an external source
**POST /api/core/items?owningCollection=<:uuid>**

Administrators can directly create an archived item (bypassing the workflow) from an external source. The content-type is uri-list.

The URI-list should contain the [external entry value](external-authority-sources.md) whose metadata should be imported

An example curl call:
```
 curl -i -X POST https://demo.dspace.org/server/api/core/items?owningCollection=1c11f3f1-ba1f-4f36-908a-3f1ea9a557eb \
 -H "Content-Type:text/uri-list" \
 --data "https://demo.dspace.org/server/api/integration/externalsources/orcid/entryValues/0000-0002-4271-0436"
```

Only one external entry value should be present. If multiple external entry values are present, a 400 bad request will be thrown
