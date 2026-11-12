---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s004-use-of-http-verbs-and-response-codes
section_title: "Use of HTTP Verbs and Response Codes"
file: "README.md"
lines: 41-50
source_sha256: 7a4858339b7ca74e
granularity: heading
---
## Use of HTTP Verbs and Response Codes

_Please note that within this section, all terms used are meant to reference RESTful terminology and/or terminology borrowed from [Spring Data REST](https://docs.spring.io/spring-data/rest/docs/current/reference/html/#repository-resources)._ 
 - `resource` - anything that can be identified via a URI. It's a representation of an underlying object. e.g. `/items/123-456-789` is a resource that represents a single DSpace Item object. For additional examples see https://restful-api-design.readthedocs.io/en/latest/resources.html
 - `object` - we use this term to mean the actual object *behind* the resource. In other words, a resource is a JSON representation of some object (often a DSpaceObject) stored in the database. This is also sometimes called an "entity" in REST terminology.
 - `collection` - a group of resources e.g. `/items` is a collection of all DSpace Item resources. This is also sometimes called a "collection resource" (e.g. in Spring Data REST)
     - Be aware that the term "collection" in this document has nothing to do with a DSpace Collection object. In REST terminology, a "collection" endpoint is simply an endpoint that returns multiple resources (objects), often in a paginated list.
     - NOTE: Spring Data REST likes to use the phrase "item resources" for individual resources within a "collection resource". We've simplified this terminology and just call them "resources" and "collections", respectively.
 - `association` - a link or relationship between two resources. This is also sometimes called an "association resource" (e.g. in Spring Data REST).
