---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s198-get-entity-type-from-label
section_title: "Get Entity type from label"
file: "entitytypes.md"
lines: 88-99
source_sha256: 889b054c4398ad61
granularity: heading
---
## Get Entity type from label
**/api/core/entitytypes/label/<:entity-type-label>**

A sample request would be https://demo.dspace.org/server/#/server/api/core/entitytypes/label/Person
The entity-type-label is mandatory

There's always at most one entity type per label.

It would respond with:
* The single entity type if there's a match
* 404 if the entity type doesn't exist
