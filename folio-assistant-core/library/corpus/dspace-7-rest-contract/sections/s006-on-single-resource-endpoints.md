---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s006-on-single-resource-endpoints
section_title: "On Single Resource Endpoints"
file: "README.md"
lines: 74-93
source_sha256: 7a4858339b7ca74e
granularity: heading
---
### On Single Resource Endpoints

This type of endpoint interacts with a single, existing resource (object). For example: `/api/core/items/<:uuid>` references a single Item resource.

- `GET` -
Returns a single resource.

- `HEAD` -
Returns whether the target resource is available.

- `PUT` -
Replaces the state of the target resource with the supplied request body. This updates the object (via full replacement). The updated information _must be included_ in the request body. An empty request body is not allowed, unless you are updating the object to be an empty object (with no attributes). Querystring parameters are not allowed, as `PUT` requests should always be performed on an existing object.

- `PATCH` -
Similar to PUT but partially updating the resources state. We adhere to the [JSON Patch specification RFC6902](https://tools.ietf.org/html/rfc6902).
See [General rules for the Patch operation](patch.md) and [Modifying metadata via Patch](metadata-patch.md) for more details.

- `DELETE` -
Deletes the target resource (object).
