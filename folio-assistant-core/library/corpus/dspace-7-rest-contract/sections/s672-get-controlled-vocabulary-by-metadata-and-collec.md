---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s672-get-controlled-vocabulary-by-metadata-and-collec
section_title: "Get controlled vocabulary by metadata and collection"
file: "vocabularies.md"
lines: 309-321
source_sha256: 67f98500ba3827b6
granularity: heading
---
### Get controlled vocabulary by metadata and collection
**/api/submission/vocabularies/search/byMetadataAndCollection?metadata=<schema.element[.qualifier]>&collection=<:collection-uuid>**

Return the controlled vocabulary configured for the specified metadata and collection if any.

The response is the same than the one of a single controlled vocabulary or an empty body if no controlled vocabulary is available for the specified parameter.

Return codes:
* 200 OK - if the operation succeed and a controlled vocabulary is available
* 204 No content - if the operation succeed but NO controlled vocabulary is available for the specified metadata and collection
* 400 Bad Request - if the metadata or collection parameter are missing of syntactically invalid
* 401 Unauthorized - if you are not authenticated
* 422 Unprocessable Entity - if the specified metadata or collection don't exist
