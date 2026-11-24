---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s043-object
section_title: "object"
file: "authorizations.md"
lines: 40-56
source_sha256: 3b81e267ca1b7f0c
granularity: heading
---
#### object
**/api/authz/authorizations/search/object?uri=<:uri>[&eperson=<:uuid>&feature=<:string>]**

The supported parameters are:
* page, size [see pagination](README.md#Pagination)
* uri: mandatory, the object to use for the authorization check. The full URI of the rest resource must be specified, i.e. https://{dspace.url}/api/core/community/{uuid}
* eperson: optional, the uuid of the eperson to evaluate for authorization. If not specified authorization of anonymous users will be returned
* feature: optional, limit the returned authorization to the specified feature (this provide an alternative to codify the authorization id rule on the client side)

It returns the list of matching authorizations. Please note that all the matching authorizations available for the requested user will be returned including the one available to anonymous users. There is no need on the client side to combine the authorizations of the current, logged-in, user with the authorizations of anonymous users. 

Return codes:
* 200 OK - if the operation succeed. It could eventually result in an empty list
* 400 Bad Request - if the uuid parameter is missing or invalid
* 401 Unauthorized - if you are not authenticated and an eperson is specified
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators and the user specified in the eperson parameter can access
