---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s351-add
section_title: "Add"
file: "patch.md"
lines: 8-15
source_sha256: 2a5688b6f6b50d64
granularity: heading
---
### Add
The add operation is expected to be supported by all the endpoints that implement the Patch method for all the json path not flagged as **READ-ONLY**.

Please note that according to the [JSON Patch specification RFC6902](https://tools.ietf.org/html/rfc6902) a subsequent add operation on an already set attribute have the effect to replace the previous value.

This use of the add operation to replace a value could be counter intuitive but it is done according to the [RFC section 4.1](https://tools.ietf.org/html/rfc6902#section-4.1)
> If the target location specifies an object member that does exist, that member's value is replaced.
