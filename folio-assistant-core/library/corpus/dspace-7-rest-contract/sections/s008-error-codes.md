---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s008-error-codes
section_title: "Error Codes"
file: "README.md"
lines: 130-137
source_sha256: 7a4858339b7ca74e
granularity: heading
---
### Error Codes
* `400 Bad Request` - if multiple URIs were given for a to-one-association
* `401 Unauthorized` (Unauthenticated) - if the request requires a logged-in user
* `403 Forbidden` - if the requester doesn't have enough privilege to execute the request, or the request requires [CSRF protection](csrf-tokens.md) and the CSRF token was missing or invalid.
* `404 Not Found` - if the requested entity or collection doesn't exist
* `405 Method Not Allowed` - if the method is not implemented, or a DELETE method is called on a non-optional association
* `422 Unprocessable Entity` - if the request is well-formed, but is invalid based on the given data. For example, if you attempt to create a resource under a non-existent parent resource, or attempt to update a read-only (non-editable) field.
