---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s281-withdrawn-item
section_title: "Withdrawn item"
file: "items.md"
lines: 100-123
source_sha256: b326bcd37dfbb1bf
granularity: heading
---
### Withdrawn item
A withdrawn item is a normal item that has been retired from the repository using a patch operation as described below. Once withdrawn the response will show an empty metadata section to everyone except than administrators.

 ```
 {
    "id":"e45a63a2-3db2-47fa-824e-3e4fdfae94f1",
    "uuid":"e45a63a2-3db2-47fa-824e-3e4fdfae94f1",
    "name":"Public item 1",
    "handle":"123456789/3",
    "metadata":{
    },
    "inArchive":false,
    "discoverable":true,
    "withdrawn":true,
    "lastModified":"2021-06-21T12:53:57.871+00:00",
    "entityType":null,
    "type":"item",
    "_links":{
        ...
    }
}
```
