---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s631-creating-a-subscription
section_title: "Creating a subscription"
file: "subscriptions.md"
lines: 210-245
source_sha256: 3f07e3549dcc5de4
granularity: heading
---
## Creating a subscription
**POST /api/core/subscriptions?eperson_id=<:uuid>&resource=<:uuid>**

Request body:

```json
{
  "subscriptionType": "content",
  "subscriptionParameterList": [
    {
      "name": "frequency",
      "value": "D"
    },
    {
      "name": "frequency",
      "value": "W"
    }
  ]
}
```
The parameters are:
eperson_id: (mandatory), the uuid of the eperson that will be grant of the subscription.
resource: (mandatory), the uuid of the resource target of the subscription

The json body must be valid that mean:
- subscriptionType must be 'content'
- name must be 'frequency'
- value must be one of the following values 'D' stand for Day, 'W' stand for Week and 'M' stand for Month

Return codes:
* 200 OK - if the operation succeed, the created subscription is returned
* 400 Bad Request - if one or both the resource and the eperson_id parameters are missing or aren't uuid
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators and Owner can create subscription
* 422 Unprocessable Entity - if the subscriptionType or subscriptionParameter name or value are invalid
