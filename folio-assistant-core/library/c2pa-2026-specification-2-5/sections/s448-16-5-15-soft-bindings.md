---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s448-16-5-15-soft-bindings
section_title: "16.5.15. Soft Bindings"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8784-8788
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 16.5.15. Soft Bindings

An active manifest may include a C2PA Manifest as an ingredient (via a `parentOf` relationship) that was discovered using a soft binding lookup. If the Claim Generator does include such a C2PA Manifest, then it shall include a `softBindingsMatched` field indicating true, and a `softBindingAlgorithmsMatched` field containing an array of strings (of soft binding algorithm names that were used to discover the ingredient C2PA Manifest). The algorithm names shall be listed with the C2PA Soft Binding Algorithm List as identified within the `alg` field of entries in that list.

<a id="_content_description_enrichment"></a>
