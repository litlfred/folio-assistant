---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s630-findbyepersonanddso
section_title: "findByEPersonAndDso"
file: "subscriptions.md"
lines: 158-209
source_sha256: 3f07e3549dcc5de4
granularity: heading
---
#### findByEPersonAndDso
**GET /api/core/subscriptions/search/findByEPersonAndDso?resource={id}&eperson_id={id}>**
Find all subscription that a person made for a dataSpaceObject

The supported parameters are:
* page, size [see pagination](README.md#Pagination)
* eperson_id: mandatory, the uuid of the eperson that benefit of content subscription
* resource: mandatory, the uuid of the DSpaceObject (Community, Collection, Item)

```json
{
  "subscriptions": [
    {
      "id": 60,
      "type": "subscription",
      "subscriptionParameterList" : [ {
			    "name" : "frequency",
			    "value" : "D"
		  } ],
      "subscriptionType": "content",
      "_links": {
        "resource": {
          "href": "http://localhost:8080/server/api/core/subscriptions/60/resource"
        },
        "eperson": {
          "href": "http://localhost:8080/server/api/core/subscriptions/60/eperson"
        },
        "self": {
          "href": "http://localhost:8080/server/api/core/subscriptions/60"
        }
      }
    }
  ],
  "_links": {
    "self": {
      "href": "http://localhost:8080/server/api/core/subscriptions/search/findByEPerson?id=49e5ff01-5467-4acd-be21-9ad7374be929"
    }
  },
  "page": {
    "size": 20,
    "totalElements": 1,
    "totalPages": 1,
    "number": 0
  }
}
```
Status codes:
* 200 OK - if the operation succeed
* 400 Bad Request - if the resource or eperson_id parameters are missing or invalid
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators or the user specified in the eperson_id parameter can use the endpoint
