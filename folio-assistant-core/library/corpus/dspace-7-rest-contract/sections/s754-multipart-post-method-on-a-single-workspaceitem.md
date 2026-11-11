---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s754-multipart-post-method-on-a-single-workspaceitem
section_title: "Multipart POST Method on a single workspaceitem"
file: "workspaceitems.md"
lines: 131-140
source_sha256: 1bb50597a317b780
granularity: heading
---
## Multipart POST Method on a single workspaceitem

Multipart POST request will typically result in the creation of a new file in the section identified by the name of the variable used for the upload (uploads is the default name of the user uploaded content). The process will be managed by the implementation bind with the identified section.
If succeed a 201 code will be returned and the new state of the workspaceitem serialized in the body.

An attribute to define the owning collection can be included. If omitted, the first collection the user can submit to will be used.

More informations about multipart post could be found in the previous section "Multipart POST Method".
