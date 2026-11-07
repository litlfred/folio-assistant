---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s538-a-3-5-embedding-manifests-into-id3
section_title: "A.3.5. Embedding manifests into ID3"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10892-10896
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.3.5. Embedding manifests into ID3

The C2PA Manifest Store shall be embedded into a ID3v2-compatible, compressed audio file (e.g., MP3 or FLAC) file as the Encapsulated object data of a General Encapsulated Object (GEOB) as defined in [ID3](https://id3.org/id3v2.3.0). The GEOB’s `MIME type` field shall be present and shall use the value for the media type for JUMBF as described in [Section 11.8, “External Manifests”](#_external_manifests).

<a id="_embedding_manifests_into_standard_midi_files_midi_1_0"></a>
