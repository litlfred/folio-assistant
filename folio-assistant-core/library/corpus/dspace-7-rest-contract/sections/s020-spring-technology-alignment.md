---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s020-spring-technology-alignment
section_title: "Spring Technology Alignment"
file: "README.md"
lines: 221-233
source_sha256: 7a4858339b7ca74e
granularity: heading
---
### Spring Technology Alignment
While it's an implementation detail, the new REST API uses many Spring REST (Java) libraries, including:

* [Spring Boot](https://spring.io/projects/spring-boot) - Provides base Spring webapp functionality
* [Spring MVC](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/web.html#mvc) - Provides Spring web framework
* [Spring REST](https://spring.io/understanding/REST) - Provides base REST tools/libraries for building REST APIs on Spring MVC
* [Spring HATEOAS](https://spring.io/projects/spring-hateoas) - Provides tools to create REST APIs following HATEOAS principles, and returning HAL Format responses.
* [Spring Data REST](https://spring.io/projects/spring-data-rest) (_alignment_) - We do **NOT** directly use Spring Data REST at this time (because of incompatibilities with our data layer). However, we have chosen to _align our implementation with Spring Data REST_ where possible.
* [Spring Data REST Hal Browser](https://docs.spring.io/spring-data/rest/docs/current/reference/html/#_the_hal_browser) - Provides the out-of-the-box HAL Browser you see when accessing our REST API
* [Spring REST Docs](https://spring.io/projects/spring-restdocs) - Provides tools to help document REST APIs in Spring MVC

Each of these libraries were chosen based on design principles above, and based on the fact that much of our underlying Java APIs use or align with Spring technologies.
