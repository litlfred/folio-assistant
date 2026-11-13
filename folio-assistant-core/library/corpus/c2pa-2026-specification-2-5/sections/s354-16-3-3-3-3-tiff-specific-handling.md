---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s354-16-3-3-3-3-tiff-specific-handling
section_title: "16.3.3.3.3. TIFF-specific Handling"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 5389-5394
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.3.3.3.3. TIFF-specific Handling

> **NOTE:**
> Previous versions of this specification documented use of general box hash with TIFF. However, the use of indirection and other characteristics of the TIFF structure make box hashing awkward, inefficient, and prone to interoperability issues, so it has been decided to remove the general box hash support for TIFF, in favor of the data hash.

<a id="_gif_specific_handling"></a>
