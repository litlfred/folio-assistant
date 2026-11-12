---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s036-log-in-as
section_title: "Log in as"
file: "authentication.md"
lines: 150-168
source_sha256: 5fe6b72a7fccbca6
granularity: heading
---
## Log in as

For any request, an `X-On-Behalf-Of` header can be included.
If the user is authorized to use this header (the user is an admin and login as is allowed), the request will be processed using the account of the provided user.  
Verifying whether the user is authorized to use this header can happen using the "loginOnBehalfOf" [feature](features.md), verified against the site

Sample request: 
```
curl -v "http://{dspace-server.url}/server/api/core/items/1911e8a4-6939-490c-b58b-a5d70f8d91fb" -H "Authorization: Bearer eyJhbG...COdbo" -H "X-On-Behalf-Of: 028dcbb8-0da2-4122-a0ea-254be49ca107"
```

The Authorization header remains the same, still linked to the actual admin using the `X-On-Behalf-Of` header.

Status codes:
* 400 Bad Request - if the X-On-Behalf-Of header doesn't contain a valid EPerson UUID
* 403 Forbidden - if you are not authorized to act on behalf of the given user
* Any status code of the functionality being used
