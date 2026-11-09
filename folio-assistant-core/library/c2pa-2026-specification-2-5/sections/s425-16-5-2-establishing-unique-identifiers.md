---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s425-16-5-2-establishing-unique-identifiers
section_title: "16.5.2. Establishing unique identifiers"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8103-8110
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 16.5.2. Establishing unique identifiers

If the ingredient being added contains a C2PA Manifest, then its unique identifier shall be taken from the [manifest label](#manifest-identifier) of the JUMBF superbox containing the ingredient’s active C2PA Manifest, and it is not necessary to provide the optional `instanceID` field of the ingredient assertion. When the claim generator provides the optional `instanceID` field of the ingredient assertion, then the value of the unique identifier shall be determined as specified by [Section 9.3, “Identifying Non-C2PA Assets”](#_identifying_non_c2pa_assets).

> **NOTE:**
> A claim generator can provide an `instanceID` field in the ingredient assertion even if the ingredient has a C2PA Manifest.

<a id="_relationship"></a>
