---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s575-describes-the-scholarly-object-in-a-commonly-use
section_title: "Describes the scholarly object in a commonly used format"
file: "signposting.md"
lines: 201-216
source_sha256: 6151d1e7ad19288a
granularity: heading
---
### Describes the scholarly object in a commonly used format
```/signposting/describedby/<:uuid>```

This endpoint provides description of an object having uuid specified in input

```xml
<title xmlns="http://datacite.org/schema/kernel-3">Item title</title>
<alternateIdentifier xmlns="http://datacite.org/schema/kernel-3" alternateIdentifierType="doi">10.1007/978-3-642-35233-1_18</alternateIdentifier>
<alternateIdentifier xmlns="http://datacite.org/schema/kernel-3" alternateIdentifierType="uri">https://{dspace.ui.url}/handle/123456789/11</alternateIdentifier>
<date xmlns="http://datacite.org/schema/kernel-3" dateType="Accepted">2023-06-22</date>
<date xmlns="http://datacite.org/schema/kernel-3" dateType="Available">2023-06-22</date>
```
Return codes:
* 200 OK - if the operation succeed
* 403 Forbidden - if you are not logged in with sufficient permissions for reading Item information.
* 404 Not found - if the item doesn't exist
