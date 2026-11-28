---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s274-accepting-denying-a-request
section_title: "Accepting / Denying a Request"
file: "item-requests.md"
lines: 98-124
source_sha256: 71f93669991b72d7
granularity: heading
---
## Accepting / Denying a Request
**PUT /api/tools/itemrequests/<:token>**

Anyone may accept or deny a request.  Access is controlled by keeping the token confidential.  The Content-Type is JSON.  Example:
```json
{
    "acceptRequest": true,
    "subject": "Request copy of document",
    "responseMessage": "Approved.  Documents attached.",
    "suggestOpenAccess": "false"
}
```
`acceptRequest` is required to set the status of a request.  `responseMessage`, `subject` and `suggestOpenAccess` are not part of the request and are not stored.  Other fields will be ignored -- requests are not updatable.

Additional Fields:

* responseMessage:  included in the body of the message sent to the requester.  OPTIONAL.
* subject:  a subject line for the response message.  OPTIONAL.
* suggestOpenAccess:  if `true`, trigger a message to repository administrators suggesting that access to the requested object(s) be opened.  OPTIONAL.

Return codes:

* 200 OK - if the operation succeeded
* 401 UNAUTHORIZED - if the current session is anonymous
* 403 FORBIDDEN - if the current session is not authenticated to one of the configured approvers
* 422 UNPROCESSABLE ENTITY - if the request could not be found or `acceptRequest` was not specified.
