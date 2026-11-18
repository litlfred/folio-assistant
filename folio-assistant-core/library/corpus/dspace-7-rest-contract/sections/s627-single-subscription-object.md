---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s627-single-subscription-object
section_title: "Single Subscription Object"
file: "subscriptions.md"
lines: 63-101
source_sha256: 3f07e3549dcc5de4
granularity: heading
---
## Single Subscription Object
**GET /api/core/subscription/<:id>**

Provide detailed information about a specific subscription.
The JSON response document is as follow

```
{
  "id" : 1,
  "type" : "subscription",
  "subscriptionParameterList" : [ {
    "name" : "frequency",
    "value" : "W"
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
}
```

JSON description:
- subscriptionType: currently only content but open to future extensions like statistics
- subscriptionParamterList: where the "frequency" is the currently only supported name and the different values ('D' stand for Day, 'W' stand for Week and 'M' stand for Month).

Status codes:
* 200 OK - if the subscription is found and current user is Admins or owner of the subscription.
* 401 Unauthorized - if you are not authenticated. Only Admins and owner of the subscription has access.
* 403 Forbidden - if you are not logged in with sufficient permissions. Only Admins and owner of the subscription has access.
* 404 Not found - if the subscription doesn't exist.
