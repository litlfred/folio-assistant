---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s626-main-endpoint
section_title: "Main Endpoint"
file: "subscriptions.md"
lines: 7-62
source_sha256: 3f07e3549dcc5de4
granularity: heading
---
## Main Endpoint
**GET /api/core/subscriptions**

Retrieve a pageable list of subscriptions. 
The subscriptions are ordered by DSpaceObject uuid ascending.
The JSON response document is as follow.

```json
{
  "_embedded" : {
    "subscriptions" : [ {
      "id" : 1,
      "type" : "subscription",
      "subscriptionParameterList" : [ {
        "name" : "frequency",
        "value" : "D"
      } ],
      "subscriptionType" : "content",
      "_links" : {
        "resource" : {
          "href" : "http://localhost/api/core/subscriptions/1/resource"
        },
        "eperson" : {
          "href" : "http://localhost/api/core/subscriptions/1/eperson"
        },
        "self" : {
          "href" : "http://localhost/api/core/subscriptions/1"
        }
      }
    } ]
  },
  "_links" : {
    "self" : {
      "href" : "http://localhost/api/core/subscriptions"
    },
    "search" : {
      "href" : "http://localhost/api/core/subscriptions/search"
    }
  },
  "page" : {
    "size" : 20,
    "totalElements" : 1,
    "totalPages" : 1,
    "number" : 0
  }
}
```

Attributes
* page, size [see pagination](README.md#Pagination)

Return codes:
* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated.
* 403 Forbidden - if you are not logged in with sufficient permissions. Only administrators can access the endpoint
