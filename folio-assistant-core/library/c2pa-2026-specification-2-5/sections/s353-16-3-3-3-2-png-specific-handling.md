---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s353-16-3-3-3-2-png-specific-handling
section_title: "16.3.3.3.2. PNG-specific Handling"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 5384-5388
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.3.3.3.2. PNG-specific Handling

A PNG file always begins with an 8 byte header (`89 50 4E 47 0D 0A 1A 0A`). To include it, use the special value `PNGh` as the first box in the list of boxes and start hashing from the first byte of the image.

<a id="_tiff_specific_handling"></a>
