---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s336-16-3-1-5-special-considerations-for-tiff-based
section_title: "16.3.1.5. Special considerations for TIFF-based"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4724-4728
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.1.5. Special considerations for TIFF-based

When hashing a TIFF-based asset into which the C2PA Manifest will be embedded, the `count` field of the C2PA Manifest Store’s IFD Entry (representing the length of the JUMBF data) should be included in the exclusion ranges. This is to support Update Manifests, which could change the size of the embedded C2PA Manifest Store.

<a id="_special_considerations_for_riff_based"></a>
