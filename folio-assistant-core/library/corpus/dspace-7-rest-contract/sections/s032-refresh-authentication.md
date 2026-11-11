---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s032-refresh-authentication
section_title: "Refresh authentication"
file: "authentication.md"
lines: 39-54
source_sha256: 5fe6b72a7fccbca6
granularity: heading
---
### Refresh authentication
Tokens are only valid for a configurable amount of time (see below). When a token is about to expire (the timestamp provided in the exp claim, see below), you can request a new token with a new expiration time (by default 30 minutes). To do so send the token using the Header `Authorization: Bearer ...` to the login endpoint without other parameters. As a response you'll get a new freshly issued token (again in the Authorization header of the response).

i.e

```
curl -v -X POST "http://{dspace-server.url}/api/authn/login" -H "Authorization: Bearer eyJhbG...COdbo" -H "X-XSRF-TOKEN: {csrf-token}"
```

Which will return something like this:

```
HTTP/1.1 200 OK
Authorization: Bearer edoDfG...S0df
```
