---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s352-remove
section_title: "Remove"
file: "patch.md"
lines: 16-20
source_sha256: 2a5688b6f6b50d64
granularity: heading
---
### Remove
The remove operation is expected to be supported by all the endpoints that implement the Patch method for all the json path not flagged as **READ-ONLY**.
Support for remove operation is expected to be provided also to the array index path level for each attribute or list where position is meaningful. This include for instance the metadata values or the uploaded bitstreams so that an author or a bitstream can be removed individually.  
The path specified will be nullified deleting all the children objects if any.
