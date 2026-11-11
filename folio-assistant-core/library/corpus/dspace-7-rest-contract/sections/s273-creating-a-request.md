---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s273-creating-a-request
section_title: "Creating a Request"
file: "item-requests.md"
lines: 72-97
source_sha256: 71f93669991b72d7
granularity: heading
---
## Creating a Request
**POST /api/tools/itemrequests**

Anyone may create an item request.  The Content-Type is JSON.  Example:
```json
{
    "itemId": "71d9fb0c-cc36-41c1-b1d3-63887b414fca",
    "allfiles": false,
    "bitstreamId": "dca2dadb-7028-40a9-ab39-1a47726df7ef",
    "requestEmail": "jqpublic@example.com",
    "requestName": "John Q. Public",
    "requestMessage": "Please send this to me."
}
```
`bitstreamId` is ignored and may be omitted if `allfiles` is `false`.  `requestMessage` is optional.  `requestEmail` and `requestName` are ignored and may be omitted if the session is authenticated -- these fields will be filled from the session user's EPerson.  If the session is anonymous then `requestEmail` is required.  `bitstreamId` is required if `allfiles` is false.  `itemId` is always required.

The response is empty, generated token should not be exposed.

An appropriate person will be notified that the request has been filed.

Return codes:

* 201 CREATED - if the operation succeeded
* 401 UNAUTHORIZED - if anonymous requests are disabled and the session is unauthenticated
* 422 UNPROCESSABLE ENTITY - if the POSTed document could not be interpreted, the Item or Bitstream could not be found, or required fields are missing
