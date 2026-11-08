---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s716-add
section_title: "Add"
file: "workspaceitem-data-cclicense.md"
lines: 47-67
source_sha256: 90c32c8eeac8db58
granularity: heading
---
### Add
To accept a CC license the client must send a JSON Patch ADD operation of the uri retrieved from the [Search CC License](submissioncclicenses.md#search-cc-license)

```json
[
  {
    "op": "add",
    "path": "/sections/<:name-of-the-form>/uri",
    "value": "http://creativecommons.org/licenses/by-nc-sa/3.0/us/"
  }
]
```

The dc.rights, dc.rights.uri and RDF bitstream will be retrieved from e.g. https://api.creativecommons.org/rest/1.5/details?license-uri=http://creativecommons.org/licenses/by-nc-sa/3.0/ 

Please note that according to the [JSON Patch specification RFC6902](https://tools.ietf.org/html/rfc6902) a subsequent add operation on the `/sections/<:name-of-the-form>/uri` will have the effect to replace the previous granted license with a new one. 
In this case a new CC license will be added to the item and the previous license deleted.

This use of the add operation to replace the license could be counter intuitive but it is done according to the [RFC section 4.1](https://tools.ietf.org/html/rfc6902#section-4.1)
> If the target location specifies an object member that does exist, that member's value is replaced.
