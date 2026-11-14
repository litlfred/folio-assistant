---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s535-a-3-2-embedding-manifests-into-png
section_title: "A.3.2. Embedding manifests into PNG"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10827-10831
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.3.2. Embedding manifests into PNG

The C2PA Manifest Store shall be embedded using an ancillary, private, not safe to copy, chunk type of `'caBX'` (as per [PNG](https://www.w3.org/TR/png-3/), clause 5.4). The `'caBX'` chunk shall precede the `'IDAT'` chunks.

<a id="_embedding_manifests_into_svg"></a>
