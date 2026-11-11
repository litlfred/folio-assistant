---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s353-replace
section_title: "Replace"
file: "patch.md"
lines: 21-25
source_sha256: 2a5688b6f6b50d64
granularity: heading
---
### Replace
The replace operation is expected to be supported by all the endpoints that implement the Patch method for all the json path not flagged as **READ-ONLY**.

The replace operation allows to replace *existent* information with new one. Attempt to use the replace operation without a previous value will return an error. See the [general errors on PATCH requests section](patch.md#error-codes)
