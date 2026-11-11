---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s606-a-5-8-size-requirements
section_title: "A.5.8. Size requirements"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11804-11808
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.5.8. Size requirements

If a BMFF-based asset uses 32-bit sizes or offsets in any box(es), e.g. the `'stco'` box, and adding boxes to conform to this specification will push the file size over 4 gigabytes, it is the responsibility of the manifest creator to edit the file to use appropriate sizes and offsets, e.g. by replacing the `'stco'` box with a `'co64'` box, before creating the manifest.

<a id="_embedding_manifests_into_zip_based_formats"></a>
