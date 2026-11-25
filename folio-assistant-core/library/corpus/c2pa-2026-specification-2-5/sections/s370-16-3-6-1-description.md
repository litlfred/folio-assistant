---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s370-16-3-6-1-description
section_title: "16.3.6.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6100-6106
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.6.1. Description

Files that are written only by appending complete lines to the end of the file, such as application logs, event logs and JSON Lines streams, grow continuously and cannot be re-signed as a whole each time content is added. For these assets a single hard binding over the complete file would be invalidated by the next line written.

A segment hash assertion binds a manifest to one bounded segment of such a file — the bytes added since the previous checkpoint — rather than to the file as a whole. Each segment hash assertion also records the position and length of the sentinel line that carries its own manifest, and a digest of the sentinel line of the immediately preceding checkpoint, so that the history of the file cannot be rewritten without invalidating the chain. The way in which checkpoints are written into an asset is defined in [Section A.3.17, “Embedding manifests into append-only text files”](#_embedding_manifests_into_append_only_text_files).

<a id="_details_2"></a>
