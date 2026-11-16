---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s376-16-3-7-3-requirements
section_title: "16.3.7.3. Requirements"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6333-6341
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.7.3. Requirements

The soft binding algorithm used shall be present as the value of the `alg` field, and the blocks over which it was applied shall be listed in the `blocks` field. If the algorithm used requires any additional parameters, they should be present as the value of `alg-params`.

The `scope` field may contain either a `region` or `timespan` field to describe the portion of digital content that the soft binding has been computed over. The `region` field, when present, contains a `region-map` object (as defined in [Section 16.9.2, “Regions of Interest”](#_regions_of_interest)). The `timespan` field, when present, describes the time interval over which the soft binding was computed in milliseconds from the start of the content.

The optional `pad` and `pad2` values, if present, shall be zero-filled byte strings.

<a id="_bindingmetadata"></a>
