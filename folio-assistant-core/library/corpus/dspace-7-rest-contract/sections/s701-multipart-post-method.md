---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s701-multipart-post-method
section_title: "Multipart POST Method"
file: "workflowitems.md"
lines: 163-166
source_sha256: 568b9a61283641e9
granularity: heading
---
## Multipart POST Method
Multipart POST request will typically result in the creation of a new file in the section identified by the name of the variable used for the upload (uploads is the default name of the user uploaded content). The process will be managed by the implementation bind with the identified section.
If succeed a 201 code will be returned and the new state of the workflowitem serialized in the body
