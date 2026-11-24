---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s665-a-10-5-compressed-warc-files
section_title: "A.10.5. Compressed WARC files"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12598-12602
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.10.5. Compressed WARC files

WARC files are commonly stored with per-record gzip compression, and other schemes such as WARC-zstd are also in use. Because each record’s hash is computed over its uncompressed bytes (see [Section A.10.3, “Hashing”](#warc_hashing)), the compression scheme does not affect the collection data hash. A record may be stored uncompressed, per-record compressed, or recompressed under a different scheme without invalidating its hash, provided its uncompressed content is unchanged. This applies equally to per-record gzip, whole-file gzip, and WARC-zstd, including its shared-dictionary and seekable profiles.

<a id="_concatenation_and_splitting"></a>
