---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s706-workspaceitem-data-of-access-sectiontype
section_title: "WorkspaceItem data of access sectionType"
file: "workspaceitem-data-access.md"
lines: 1-34
source_sha256: b63435c1bff84133
granularity: heading
---
# WorkspaceItem data of access sectionType
[Back to the definition of the workspaceitems endpoint](workspaceitems.md)

The section data represent the data about the access condition.
This section will have the same name as the configuration available off the /api/config/submissionaccessoptions/. As an example, a WorkspaceItem section here named itemAccessConditions would correspond to a configuration /api/config/submissionaccessoptions/itemAccessConditions.

```json
{
  "discoverable": true,
  "accessConditions": [
    {
      "id": 123,
      "name": "openaccess"
    },
    {
      "id": 126,
      "name": "administrator"
    },
    {
      "id": 127,
      "name": "embargo",
      "startDate": "2018-06-24T00:40:54.970+0000"
    },
    {
      "id": 128,
      "name": "lease",
      "endDate": "2017-12-24T00:40:54.970+0000"
    }
  ]
}
```
* discoverable: if the current item not discoverable, this meaning that It's simply hidden from all search/browse/OAI results, and is therefore only accessible via direct link (or bookmark). To manage the access restriction (aka resource policies) see the accessCondition property below.
* accessConditions: an array of all the policies that has been applied by the user to the item.
