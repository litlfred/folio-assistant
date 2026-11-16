---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s720-workspaceitem-data-of-license-sectiontype
section_title: "WorkspaceItem data of license sectionType"
file: "workspaceitem-data-license.md"
lines: 1-17
source_sha256: aadd1539f4aba55d
granularity: heading
---
# WorkspaceItem data of license sectionType
[Back to the definition of the workspaceitems endpoint](workspaceitems.md)

The section data represent the data about the granted deposit license

```json
{
  	"granted": true,
  	"url": "https://demo.dspace.org/server/api/core/bitstreams/004a297e-fd06-4662-ae51-73e4b7c165c8/content",
    "acceptanceDate": "2017-11-20T10:32:42Z"
}
```

* granted: true or false
* url (**READ-ONLY**): the URL where the granted license is visible
* acceptanceDate (**READ-ONLY**): the timestamp of the acceptance as recorded in the dcterms:dataAccepted metadata of the license bitstream. For license granted before than DSpace7 the acceptanceDate will be *null*
