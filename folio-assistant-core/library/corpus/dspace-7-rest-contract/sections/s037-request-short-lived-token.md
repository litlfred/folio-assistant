---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s037-request-short-lived-token
section_title: "Request short lived token"
file: "authentication.md"
lines: 169-199
source_sha256: 5fe6b72a7fccbca6
granularity: heading
---
## Request short lived token

**POST /api/authn/shortlivedtokens**

When clicking on a link to download a protected file in the UI no authentication header will be sent along. This endpoint can provide a short lived token (MAX 2 seconds) that the UI can append to file downloads.
 
The token follows the "JSON Web Token structure", same as the login tokens.
  
 ```
 curl -v -X POST https://{dspace-server.url}/api/authn/shortlivedtokens -H "Authorization: Bearer eyJhbG...COdbo" -H "X-XSRF-TOKEN: {csrf-token}"
 ```
 
 ```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJlaWQiOiJjZDgyNGE2MS05NWJlLTRlMTYtYmNjZC01MWZlYTI2NzA3ZDAiLCJzZyI6W10sImV4cCI6MTU5MDQxMzUwNn0.XRK4ldh9l4My45gJzLtcW97hVUpbtM5oAQsxuQ2V37c",
  "_links": {
    "self": {
      "href": "http://${dspace-server.url}/api/authn/shortlivedtokens"
    }             
  }
}
```  

Return codes
- 200 Ok. 
- 401 Unauthorized. If no user is logged in

**GET /api/authn/shortlivedtokens**

_As of 7.5, this option is no longer supported._  Please use POST instead (see above).
