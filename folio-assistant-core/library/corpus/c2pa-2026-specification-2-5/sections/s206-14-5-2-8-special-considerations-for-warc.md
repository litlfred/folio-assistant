---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s206-14-5-2-8-special-considerations-for-warc
section_title: "14.5.2.8. Special Considerations for WARC"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2710-2717
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.5.2.8. Special Considerations for WARC

For WARC files, the C2PA Manifest Store shall be located by following the procedure defined in [Section A.10, “Embedding manifests into WARC files”](#embedding_manifests_into_warc). The validator shall scan the file for a record whose `WARC-Type` is `c2pa-provenance` and whose `Content-Type` is `application/c2pa`. If no such record is found, the file does not contain a C2PA Manifest Store. If more than one such record is present, the asset shall be treated as if no manifests were located. If exactly one C2PA manifest record is found, the validator shall extract the C2PA Manifest Store from its block.

> **NOTE:**
> When a companion CDX or CDXJ index is available, a validator may use it to locate the C2PA manifest record without scanning the entire file.

<a id="manifests-by-reference"></a>
