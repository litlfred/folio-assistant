---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s002-table-of-contents
section_title: "Table of Contents"
file: "README.md"
lines: 7-32
source_sha256: 7a4858339b7ca74e
granularity: heading
---
## Table of Contents
* [REST Endpoints](#rest-endpoints)
* [Use of HTTP Verbs and Response Codes](#use-of-http-verbs-and-response-codes)
    * [On Collection of Resource Endpoints](#on-collection-of-resources-endpoints)
    * [On Single Resource Endpoints](#on-single-resource-endpoints)
    * [On Sub-Path of a Single Resource Endpoint (Associations)](#on-sub-path-of-a-single-resource-endpoint-associations)
    * [Error Codes](#error-codes)
* [Pagination](#pagination)
    * [Pagination Request Parameters](#pagination-request-parameters)
    * [Pagination Response](#pagination-response)
    * [Out of Bound Pages](#out-of-bound-pages)
    * [Pagination Error Codes](#pagination-error-codes)
* [REST Design Principles](#rest-design-principles)
    * [On the Naming of Endpoints](#on-the-naming-of-endpoints)
    * [HATEOAS & HAL](#hateoas--hal)
    * [Statelessness](#statelessness)
        * [JSON Web Tokens](#json-web-tokens)
    * [ALPS](#alps---application-level-profile-semantics)
    * [Spring Technology Alignment](#spring-technology-alignment)
* [Content Negotiation](#content-negotiation)
    * [Language Support](#language-support)
* [Proxies](#proxies)
* [ETags & Conditional Headers](#etags--conditional-headers)
* [API Versioning](#api-versioning)
* [Community Resources](#community-resources)
