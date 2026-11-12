---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s044-objects
section_title: "objects"
file: "authorizations.md"
lines: 57-74
source_sha256: 3b81e267ca1b7f0c
granularity: heading
---
#### objects
**/api/authz/authorizations/search/objects?uuid=<:uuid>&type=<:type>[&eperson=<:uuid>&feature=<:string>]**

The supported parameters are:
* page, size [see pagination](README.md#Pagination)
* uuid: mandatory, repeatable. Represents the list of objects to be used for the authorization check. For each of them, the UUID must be specified.2
* type: mandatory. Represents the type of resource(s) (i.e. "core.item", "workflow.workflowitem",...)  on which authorizations are checked.
* eperson: optional, the uuid of the eperson to evaluate for authorization. If not specified authorization of anonymous users will be returned
* feature: optional, repeatable. Represents the list of features. Limits the returned authorizations to the specified features (this provide an alternative to codify the authorization id rule on the client side)

It returns the list of matching authorizations. Please note that all the matching authorizations available for the requested user will be returned including the one available to anonymous users. There is no need on the client side to combine the authorizations of the current, logged-in, user with the authorizations of anonymous users. 

Return codes:
* 200 OK - if the operation succeed. It might result in an empty list
* 400 Bad Request - if the uuid parameter is missing or invalid
* 401 Unauthorized - if you are not authenticated and an eperson is specified
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators and the user specified in the eperson parameter can access
