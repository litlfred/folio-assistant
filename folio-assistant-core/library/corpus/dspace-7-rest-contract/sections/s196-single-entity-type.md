---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s196-single-entity-type
section_title: "Single Entity Type"
file: "entitytypes.md"
lines: 59-81
source_sha256: 889b054c4398ad61
granularity: heading
---
## Single Entity Type
**/api/core/entitytypes/<:id>**

A sample can be found at https://demo.dspace.org/server/#https://demo.dspace.org/server/api/core/entitytypes/1

```json
{
  "id": 1,
  "label": "Publication",
  "type": "entitytype",
  "_links": {
    "self": {
      "href": "https://demo.dspace.org/server/api/core/entitytypes/1"
    },
    "relationshiptypes": {
      "href": "https://demo.dspace.org/server/api/core/entitytypes/1/relationshiptypes"
    }
  }
}
```

It contains a HAL link to the Relationship Types for the current Entity Type (not embedded)
