---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s642-creating-a-supervision-order
section_title: "Creating a supervision order"
file: "supervisionorders.md"
lines: 58-81
source_sha256: 7ac02348ade76459
granularity: heading
---
## Creating a supervision order

**POST /api/core/supervisionorders?uuid=<:item uuid>&group=<:group uuid>&type=<:type>**

The supported parameters are:
* uuid: mandatory. The uuid of the item for which supervision order must be created
* group: mandatory. The uuid of the group whose members will be supervisors
* type: mandatory. The type of permissions to be granted to above group's members: 
  * NONE: no grants
  * EDITOR: READ and WRITE permissions will be added to item and its bitstreams
  * OBSERVER: READ permissions will be added to item and its bitstreams

A sample CURL command would be:
```
curl -i -X POST 'https://demo.dspace.org/server/api/core/supervisionorders?uuid=<uuid>&group=<group uuid>&type=NONE' -H 'Authorization: Bearer eyJrasdfw…' 
```

* 201 Created - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 400 Bad Request - if both or one among the uuid or group parameter is missing or syntactically invalid (not an uuid), or if they resolve to an unexpected DSpace Object type.
* 403 Forbidden - if you are not logged in with sufficient permissions (Administrator)
* 422 Unprocessable Entity - if one among item or group does not exist, if a supervision order for the same group already exists, or if the item referenced by uuid is not an inprogress submission. A Supervision order can be created only when the item is in the submission or workflow process
