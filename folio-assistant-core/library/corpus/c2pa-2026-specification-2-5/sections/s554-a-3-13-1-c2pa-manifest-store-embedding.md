---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s554-a-3-13-1-c2pa-manifest-store-embedding
section_title: "A.3.13.1. C2PA Manifest Store embedding"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11097-11101
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.13.1. C2PA Manifest Store embedding

The C2PA Manifest Store shall be embedded as the data of an extension block with the 4-byte ASCII type identifier `C2PA` (`0x43 0x32 0x50 0x41`). The block data is a complete C2PA Manifest Store with no additional framing or transformation.

<a id="_locating_the_manifest_store_2"></a>
