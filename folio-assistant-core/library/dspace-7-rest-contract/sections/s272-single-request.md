---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s272-single-request
section_title: "Single Request"
file: "item-requests.md"
lines: 13-71
source_sha256: 71f93669991b72d7
granularity: heading
---
## Single Request
**/api/tools/itemrequests/<:token>**

Provide detailed information about a specific request. The JSON response document will resemble this:
```json
{
  "id":1,
  "decisionDate":null,
  "expires":null,
  "requestDate":"2021-09-17T14:55:50.089+00:00",
  "token":"c19e820ea0b270f0ec98323864dcc8b8",
  "acceptRequest":false,
  "allfiles":false,
  "type":"itemrequest",
  "bitstreamId":"dca2dadb-7028-40a9-ab39-1a47726df7ef",
  "itemId":"71d9fb0c-cc36-41c1-b1d3-63887b414fca",
  "requestEmail":"jsmith@example.com",
  "requestMessage":"Please send me a copy of this.",
  "requestName":"John Smith",
  "_links":{
    "bitstream":{
      "href":"https://demo.dspace.org/server/api/tools/itemrequests/1/bitstream"
    },
    "item":{
      "href":"https://demo.dspace.org/server/api/tools/itemrequests/1/item"
    },
    "self":{
      "href":"https://demo.dspace.org/server/api/tools/itemrequests/1"
    }
  }
}
```

Item properties:

  * type: always "itemrequest".  READ-ONLY
  * id: internal unique identifier of the request.  READ-ONLY
  * itemId: UUID of the requested Item.
  * bitstreamId: UUID of the requested bitstream.
  * allfiles: true if the request is for all bitstreams of the item.
  * requestEmail: email address of the person requesting the files.
  * requestName: Human-readable name of the person requesting the files.
  * requestMessage: arbitrary message provided by the person requesting the files.
  * requestDate: date that the request was recorded.  READ-ONLY.
  * expires: date on which the request is considered expired.
  * acceptRequest: true if the request has been granted.
  * decisionDate: date that the request was granted or denied.  READ-ONLY.
  * token: opaque string which uniquely identifies this request.  READ-ONLY

Exposed links:

  * item: the item requested
  * bitstream: the bitstream requested

Return codes:

* 200 OK - if the operation succeeded
* 404 NOT FOUND - if the token is unknown (no such request exists)
