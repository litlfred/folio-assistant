---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s396-16-4-1-5-watermarking
section_title: "16.4.1.5. Watermarking"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6871-6878
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.4.1.5. Watermarking

When using a `c2pa.watermarked.bound` action, a [soft binding assertion](#soft_binding_assertion) shall also be included in the C2PA Manifest to describe the inserted watermark. The `c2pa.watermarked.bound` action should reference one or more of these corresponding soft binding assertions using the `relatedAssertions` field in the `parameters` object of that action.

> **NOTE:**
> The `c2pa.watermarked` action is deprecated in favour of the more specific `c2pa.watermarked.bound` and `c2pa.watermarked.unbound` actions.

<a id="_action_templates"></a>
