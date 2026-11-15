---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s035-status
section_title: "Status"
file: "authentication.md"
lines: 85-149
source_sha256: 5fe6b72a7fccbca6
granularity: heading
---
## Status
**/api/authn/status**

The authentication status can be checked by sending your received token to the status endpoint in the Authorization header in a GET request:

```
curl -v "http://{dspace-server.url}/api/authn/status" -H "Authorization: Bearer eyJhbG...COdbo"
```

This will return the authentication status, E.G.:

```json
{
  "okay" : true,
  "authenticated" : true,
  "type" : "status",
  "_links" : {
    "eperson" : {
      "href" : "http://${dspace-server.url}/api/eperson/epersons/2245f2c5-1bed-414b-a313-3fd2d2ec89d6"
    }
  },
  "_embedded" : {
    "eperson" : {
      "uuid" : "2245f2c5-1bed-414b-a313-3fd2d2ec89d6",
      "email" : "test@dspace.com",
      ...
      },
    "specialGroups" : {
        "_embedded" : {
           "specialGroups" : [ {
             "id" : "3d07510c-2c33-48f5-8a04-f63bc9a63296",
             "uuid" : "3d07510c-2c33-48f5-8a04-f63bc9a63296",
             "name" : "A Special Group",
             ... } ],
        "page" : {
            "number" : 0,
            "size" : 20,
            "totalPages" : 1,
            "totalElements" : 1
        },
        "_links" : {
            "self" : {
                "href" : "http://${dspace-server.url}/api/authn/status/specialGroups"
            }
        }
    }
   }
}
```

Fields
- Okay: True if REST API is up and running, should never return false
- Authenticated: True if the token is valid, false if there was no token or the token wasn't valid
- Type: Type of the endpoint, "status" in this case

Links	
- returns a link to the authenticated eperson
- specialGroups: return the special groups associated with the current authentication context. Please note that specialGroups can be present also without an authenticated user (i.e. via IPAuthentication)

Embedded
- Embeds the authenticated eperson

Return code
- 200 Ok in all the scenario both authenticated than not authenticated (valid token, invalid token or missing token)
