---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s252-14-10-5-3-5-retrieved-representation
section_title: "14.10.5.3.5. Retrieved representation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3487-3491
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.10.5.3.5. Retrieved representation

For the purposes of the declared-size, media-type, and hash checks in [Section 14.10.5.2, “Validation of External References”](#_validation_of_external_references), the retrieved representation of a response consists of the response body bytes after removing any HTTP transfer coding (e.g. chunked transfer encoding) and any `Content-Encoding` (e.g. `gzip`, `br`, `deflate`), and before any character-set decoding, parsing, normalization, or other transformation of those bytes. Declared size comparison, media type validation, and hash computation shall all be performed against this same representation.

<a id="_resource_limits"></a>
