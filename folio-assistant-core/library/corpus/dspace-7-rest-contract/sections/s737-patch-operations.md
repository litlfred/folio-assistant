---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s737-patch-operations
section_title: "Patch operations"
file: "workspaceitem-data-upload.md"
lines: 51-55
source_sha256: 28bff004b93bd7d6
granularity: heading
---
## Patch operations
The PATCH method expects a JSON body according to the [JSON Patch specification RFC6902](https://tools.ietf.org/html/rfc6902)

Each successful Patch operation will return a HTTP 200 CODE with the new workspaceitem as body. See also the [General rules for the Patch operation](patch.md) for more details.
