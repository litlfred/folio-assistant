---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s016-hateoas-hal
section_title: "HATEOAS & HAL"
file: "README.md"
lines: 206-210
source_sha256: 7a4858339b7ca74e
granularity: heading
---
### HATEOAS & HAL
The REST API supports the [HATEOAS paradigm](https://restfulapi.net/hateoas/) and adopt the [HAL format](http://stateless.co/hal_specification.html) to express links and embedded resources. Links are always **absolute** to allow for easier implementation of "follow link" methods on the REST client side.

Because the API responds using the HAL Format, we distribute it with an [embedded HAL Browser provided by Spring](https://docs.spring.io/spring-data/rest/docs/current/reference/html/#_the_hal_browser).
