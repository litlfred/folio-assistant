---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s605-a-5-7-external-references
section_title: "A.5.7. External references"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11799-11803
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.5.7. External references

Externally referenced content declared inside BMFF boxes, such as in a `'dref'`, `'url'`, or `'urn'` box, that the claim generator wishes to make tamper evident shall **not** exclude the referencing box and shall include a separate [cloud data assertion](#_cloud_data) for each external reference to be hashed.

<a id="_size_requirements"></a>
