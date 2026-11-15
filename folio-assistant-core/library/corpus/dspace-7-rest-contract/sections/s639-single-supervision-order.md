---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s639-single-supervision-order
section_title: "Single Supervision Order"
file: "supervisionorders.md"
lines: 11-41
source_sha256: 7ac02348ade76459
granularity: heading
---
## Single Supervision Order
**/api/core/supervisionorders/<:id>**

Provides information about a single supervision order defined into the system

```json
{
  "id": 42,
  "_links": {
    "item": {
      "href": "https://demo.dspace.org/server/api/core/items/092b59e8-8159-4e70-98b5-93ec60bd3431"
    },
    "group": {
      "href": "https://demo.dspace.org/server/api/eperson/groups/4ebb837c-c2ae-4928-9bb1-6f51df4eeb60"
    }
  }
```
Supervision order properties:
* id: the identifier assigned to the supervision order

Exposed links:
* item: the item on which this supervision order is defined
* group: the group that can supervise the item

Status codes:
* 200 OK - if the item is found and it is visible to the current user.
* 401 Unauthorized - if you are not authenticated.
* 403 Forbidden - if you are not logged in with sufficient permissions (Administrators).
* 404 Not found - if the supervision order doesn't exist
