---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s380-16-3-7-5-1-validating-soft-binding-matches
section_title: "16.3.7.5.1. Validating Soft Binding Matches"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6570-6580
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.3.7.5.1. Validating Soft Binding Matches

A common use for soft bindings is to discover the active manifest, from a manifest repository, for an asset whose C2PA Manifest is absent or invalid.

Discovery of the C2PA Manifest shall be performed using one, or a combination of, algorithms identified by the `alg` field within the C2PA Soft Binding Algorithm List. The list is maintained as a JSON document by the C2PA at the following location: [https://sbal.c2pa.org](https://sbal.c2pa.org)

If a C2PA Manifest is found in a manifest repository, and that manifest contains one or more soft binding assertions, then the matcher shall ensure that all soft binding assertions in the located manifest match the soft bindings used to perform the discovery.

A soft binding assertion shall be considered a match if both the algorithm identifier (`alg`) and the value (`value`) described within the assertion match the algorithm identifier (`alg`) and value (`value`) used to perform the match. Matching is performed in the manner prescribed by the specified algorithm.

<a id="_provenance_workflow"></a>
