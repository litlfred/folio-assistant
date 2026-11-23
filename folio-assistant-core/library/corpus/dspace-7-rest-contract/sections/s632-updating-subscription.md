---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s632-updating-subscription
section_title: "Updating subscription"
file: "subscriptions.md"
lines: 246-275
source_sha256: 3f07e3549dcc5de4
granularity: heading
---
## Updating subscription
** PUT /api/core/subscription/<:id>**

It is possible to update a subscription with id
`curl -X PUT '{dspace7-url}/api/core/subscriptions/{id}
' -H "Authorization: Bearer ..." -H 'Content-Type: application/json'

```json
{
  "subscriptionType": "content",
  "subscriptionParameterList": [
    {
      "name": "frequency",
      "value": "M"
    }
  ]
}
```

The json body must be valid that mean:
- subscriptionType must be 'content'
- name must be 'frequency'
- value must be one of the following values: 'D' stand for Day, 'W' stand for Week and 'M' stand for Month

Return codes:
* 200 OK - if the operation succeed, the created subscription is returned
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators and Owner can create subscription
* 422 Unprocessable Entity - if the subscriptionType or subscriptionParameter name or value are invalid
