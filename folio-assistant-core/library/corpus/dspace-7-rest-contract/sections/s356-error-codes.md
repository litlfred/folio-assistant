---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s356-error-codes
section_title: "Error codes"
file: "patch.md"
lines: 32-37
source_sha256: 2a5688b6f6b50d64
granularity: heading
---
## Error codes
* **405 Method Not Allowed** - if the PATCH method is not implemented
* **415 Unsupported Media Type** - if the PATCH method is called without the JSON Patch Media Type that is application/json-patch+json
* **400 Bad Request** - Malformed patch document (taken from rfc5789#section-2.2) - When the server determines that the patch document provided by the client is not properly formatted, it SHOULD return a 400 (Bad Request) response. The definition of badly formatted depends on the patch document chosen. 
* **422 Unprocessable Entity** - Unprocessable request:  Can be specified with a 422 (Unprocessable Entity) response ([RFC4918], Section 11.2) when the server understands the patch document and the syntax of the patch document appears to be valid, but the server is incapable of processing the request.  This might include attempts to modify a resource in a way that would cause the resource to become invalid; A response json object should be returned with more details about the exception t.b.d (i.e. the idx of the patch operation that fail, detail about the failure on execution such as wrong idx in an array path, unsupported patch operation, etc.)
