---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s255-14-11-1-explanation
section_title: "14.11.1. Explanation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3520-3526
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.11.1. Explanation

A validator shall perform the [validation steps](#_validation_process) for the asset being presented and its active manifest. If any of the steps conclude the active manifest is invalid, that manifest shall be rejected with the indicated failure code.

An asset’s active manifest may list one or more ingredients, through the use of [ingredient assertions](#ingredient_assertion). Some of those ingredients may have their own manifests associated with them, and some of those manifests may themselves have ingredients and ingredient manifests.

<a id="_processing_ingredient_manifests"></a>
