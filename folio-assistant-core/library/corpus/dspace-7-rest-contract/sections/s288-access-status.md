---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s288-access-status
section_title: "Access Status"
file: "items.md"
lines: 281-328
source_sha256: b326bcd37dfbb1bf
granularity: heading
---
### Access Status

**GET /api/core/items/<:uuid>/accessStatus**

This endpoint expose the mechanism for retrieving and calculating the access status of a DSpace item.
It can be checked by calling this endpoint with the the corresponding item UUID.

```
curl -v "http://{dspace-server.url}/api/core/items/2245f2c5-1bed-414b-a313-3fd2d2ec89d6/accessStatus"
```

This will return the access status, E.G.:

_200 - Response if the UUID parameter is valid_
```json
{
  "status": "metadata.only",
  "type": "accessStatus",
  "_links" : {
    "self" : {
      "href" : "http://{dspace-server.url}/api/core/items/2245f2c5-1bed-414b-a313-3fd2d2ec89d6/accessStatus"
    }
  }
}
```

Fields
- Status: String value if the UUID is valid
- Type: Type of the endpoint, "accessStatus" in this case

Exposed links:
- self: The valid URL to the item's access status

Default access status values
- metadata.only = Item doesn't contain a primary file
- open.access = Item's primary file is downloadable to anonymous users
- embargo = Item's primary file is under an embargo
- restricted = Item's primary file is not downloadable to anonymous users
- unknown = Item's status is indeterminable or unknown

_Note: the calculation of those default values is based on the policies of the item's primary file._
_The term primary file also refers to the first file in the original bundle if no primary file is defined._

Return code
- 200 Ok if the parameter is a valid item UUID
- 400 Bad Request if the parameter is invalid
- 404 Not Found if the item cannot be retrieved
