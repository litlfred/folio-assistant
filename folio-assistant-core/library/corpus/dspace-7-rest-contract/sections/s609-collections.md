---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s609-collections
section_title: "collections"
file: "submissiondefinitions.md"
lines: 37-41
source_sha256: 35baec16e4144d5b
granularity: heading
---
#### collections
**/api/config/submissiondefinitions/<:definition-name>/collections**

It returns the list of collection that make an explicit use of the submission-definition. If a collection doesn't specify the submission-definition to be used the default mapping apply but this collection is not included in the list returned by this method
