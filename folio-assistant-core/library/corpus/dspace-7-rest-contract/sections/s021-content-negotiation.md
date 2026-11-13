---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s021-content-negotiation
section_title: "Content Negotiation"
file: "README.md"
lines: 234-240
source_sha256: 7a4858339b7ca74e
granularity: heading
---
## Content Negotiation
The DSpace REST API only supports the `application/json` response format at this time. So, there is no real content negotiation according to the broad meaning of the term.

Nevertheless, some concepts of content negotiation still apply.
* `POST` requests may accept a `content-type` other than `application/json` in order to drive the creation of the resource. For example, `text/uri-list` and `multipart/form-data` may be supported.
* `PUT` requests on the association endpoint accept `text/uri-list` according to Spring Data best practices.
