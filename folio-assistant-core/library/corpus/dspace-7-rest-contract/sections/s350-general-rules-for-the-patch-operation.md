---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s350-general-rules-for-the-patch-operation
section_title: "General rules for the Patch operation"
file: "patch.md"
lines: 1-7
source_sha256: 2a5688b6f6b50d64
granularity: heading
---
# General rules for the Patch operation
[Back to the index](README.md)

The PATCH method expects a JSON body according to the [JSON Patch specification RFC6902](https://tools.ietf.org/html/rfc6902)

Each successful Patch operation will return a **HTTP 200 CODE** with the new state of the patched resource as body similar to what is returned for a GET request.
