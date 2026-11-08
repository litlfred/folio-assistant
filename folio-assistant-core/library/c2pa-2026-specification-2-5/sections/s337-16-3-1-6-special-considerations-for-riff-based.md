---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s337-16-3-1-6-special-considerations-for-riff-based
section_title: "16.3.1.6. Special considerations for RIFF-based"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4729-4733
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.1.6. Special considerations for RIFF-based

When hashing a RIFF-based asset into which the C2PA Manifest will be embedded, the size field of the top-level `RIFF` chunk (the four bytes at offset 4) should be included in the exclusion ranges. This is to support Update Manifests, which could change the size of the embedded C2PA Manifest Store; because this size field covers the entire file, any change to the size of the C2PA Manifest Store rewrites it.

<a id="_bmff_based_hash"></a>
