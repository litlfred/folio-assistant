---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s148-12-2-2-6-hashing-append-only-text-assets
section_title: "12.2.2.6. Hashing append-only text assets"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1919-1923
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 12.2.2.6. Hashing append-only text assets

For files that are written only by appending complete lines to the end of the file, such as application logs, event logs and JSON Lines streams, as described in [Section A.3.17, “Embedding manifests into append-only text files”](#_embedding_manifests_into_append_only_text_files), a [segment hash assertion](#_segment_hash) shall be used. Each such assertion is a hard binding over one bounded segment of the file rather than over the file as a whole, and the segments are linked into a chain of checkpoints so that the complete history of the file can be verified.

<a id="_hashing_a_collection"></a>
