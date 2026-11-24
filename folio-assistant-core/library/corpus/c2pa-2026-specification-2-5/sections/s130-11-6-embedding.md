---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s130-11-6-embedding
section_title: "11.6. Embedding"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1731-1738
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 11.6. Embedding

A C2PA Manifest Store can be embedded into a variety of file formats covering media types including images, videos, audio, fonts, and documents. [Appendix A, _Embedding manifests_](#embedding_annex) provides the technical details on how to embed C2PA Manifests into each specifically supported file format.

> **NOTE:**
> Many classic image formats such as BMP do not support the embedding of arbitrary data, so the use of an [external manifest](#_external_manifests) is required.

<a id="_multiple_step_processing"></a>
