---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s024-etags-conditional-headers
section_title: "ETags & conditional headers"
file: "README.md"
lines: 266-275
source_sha256: 7a4858339b7ca74e
granularity: heading
---
## ETags & conditional headers
The ETag header (<http://tools.ietf.org/html/rfc7232#section-2.3>) provides a way to tag resources. This can prevent clients from overriding each other while also making it possible to reduce unnecessary calls. It is expected that all the returned document have an ETag

The ETag value can be used with in GET request with the *If-None-Match* conditional header. If the header MATCHES the ETag, the API will conclude nothing has changed, and instead of sending a copy of the resource, an HTTP 304 Not Modified status code is returned.

The ETag value can be also used with DELETE, POST, PUT and PATCH with the *If-Match* conditional header to avoid performing an action on changed resources (concurrency issues, optimistic lock approach).

Finally, when possible the If-Modified-Since header in GET request should be respected. If the resource has been not modified since the value of the Header the API should return an
HTTP 304 Not Modified status code. Resources that support the *If-Modified-Since* header *MUST* return the Last-Modified Header in the GET response. That header *MUST BE NOT* returned by resources not able to manage the If-Modified-Since header.
