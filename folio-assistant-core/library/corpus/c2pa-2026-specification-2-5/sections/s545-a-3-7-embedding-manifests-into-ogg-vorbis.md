---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s545-a-3-7-embedding-manifests-into-ogg-vorbis
section_title: "A.3.7. Embedding manifests into OGG Vorbis"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10992-10996
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.3.7. Embedding manifests into OGG Vorbis

Ogg Vorbis (as described in [RFC 3533](https://www.rfc-editor.org/rfc/rfc3533)) is an open-source, lossy audio compression format encapsulated within the Ogg multimedia container. The C2PA Manifest Store shall be embedded in its own dedicated logical bitstream within the container. The first packet of this stream starts with the 5-byte identifier `\x00c2pa`, and the C2PA Manifest Store data follows immediately after.

<a id="_embedding_manifests_into_tiff_based_assets"></a>
