---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s629-findbyeperson
section_title: "findByEPerson"
file: "subscriptions.md"
lines: 103-157
source_sha256: 3f07e3549dcc5de4
granularity: heading
---
#### findByEPerson
**GET /api/core/subscription/search/findByEPerson?uuid=<:ePerson-uuid>**

The supported parameters are:
* page, size [see pagination](README.md#Pagination)
* uuid: mandatory, the uuid of the eperson that benefit of content subscription

```json
{
  "_embedded": {
    "subscriptions": [
      {
        "id": 60,
        "type": "subscription",
        "subscriptionParameterList" : [ {
			    "name" : "frequency",
			    "value" : "M"
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
    ]
  },
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
* 400 Bad Request - if the uuid parameter is missing or invalid
* 422 Unprocessable Entity - if the uuid resolve to a different DSpace Object Type than eperson
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators or the user specified in the uuid parameter can use the endpoint
