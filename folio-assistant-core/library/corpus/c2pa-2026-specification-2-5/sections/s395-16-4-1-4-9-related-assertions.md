---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s395-16-4-1-4-9-related-assertions
section_title: "16.4.1.4.9. Related Assertions"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6857-6870
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.4.1.4.9. Related Assertions

An action may include a `relatedAssertions` key in the `parameters` object. If present, the value shall be an array of one or more hashed JUMBF URIs identifying assertion(s) that are related to the action.

Each entry in `relatedAssertions` shall reference an assertion in the same C2PA Manifest as the action. The related assertion(s) provide additional information about, or are otherwise related to, the action.

Entries in `relatedAssertions` shall not reference an actions nor an ingredient assertion (i.e., an assertion whose label is `c2pa.actions`, `c2pa.actions.v2`, `c2pa.ingredient`, `c2pa.ingredient.v2`, or `c2pa.ingredient.v3`).

Manifest Consumers may use these references to present additional contextual information about the action.

> **NOTE:**
> This mechanism provides a general-purpose way for actions to reference assertions other than ingredient assertions. For example, to add additional metadata about an individual action, an [assertion metadata assertion](#_metadata_about_assertions) could be referenced from `relatedAssertions` on a specific action.

<a id="_watermarking"></a>
