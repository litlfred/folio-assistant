---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s335-16-3-1-4-special-consideration-for-png
section_title: "16.3.1.4. Special consideration for PNG"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4719-4723
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.1.4. Special consideration for PNG

When hashing a PNG (.png) file into which the C2PA Manifest will be embedded, it is important that the `Length` and the `'caBX'` (representing the chunk type) of the chunk containing the JUMBF data be included in the exclusion range.

<a id="_special_considerations_for_tiff_based"></a>
