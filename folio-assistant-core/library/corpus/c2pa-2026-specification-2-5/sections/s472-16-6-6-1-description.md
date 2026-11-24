---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s472-16-6-6-1-description
section_title: "16.6.6.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9437-9443
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.6.6.1. Description

In previous versions of this specification, a concept of a data box as a special type of JUMBF box was used as a way to enable the arbitrary embedding of data into a C2PA Manifest, such as for thumbnails, icons and `inputTo` ingredients. It was determined that doing this via a new type of box introduced unnecessary complexities and missing functionality - such as the inability to redact data boxes. Accordingly, that concept has been deprecated in favor of a standard assertion which uses a standard JUMBF Embedded File content type box to contain the data.

An embedded data assertion shall have a label that starts with `c2pa.embedded-data` and follows the [rules of assertion labels](#_multiple_instances) with respect to multiple instances. Additionally, some other assertion types will be technically equivalent to a embedded data assertion, but will have their own unique labels (e.g., `c2pa.thumbnail.claim`).

<a id="_technical_details_2"></a>
