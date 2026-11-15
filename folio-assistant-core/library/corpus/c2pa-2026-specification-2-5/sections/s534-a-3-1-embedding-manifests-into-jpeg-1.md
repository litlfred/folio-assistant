---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s534-a-3-1-embedding-manifests-into-jpeg-1
section_title: "A.3.1. Embedding manifests into JPEG 1"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10816-10826
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.3.1. Embedding manifests into JPEG 1

The C2PA Manifest Store shall be embedded as the data contained in an **APP11** marker segment as defined in [ISO/IEC 18477-3](https://www.iso.org/standard/66071.html).

Since a single marker segment in JPEG 1 cannot be larger than 64K bytes, it is likely that multiple **APP11** segments will be required, and they shall be constructed as per the JPEG 1 standard and ISO 19566-5:2023, D.2. When writing multiple segments, they shall be written in sequential order, and they shall be contiguous (i.e., one segment immediately following the next).

The same method described above shall also be applied to Exif compressed files([Exif](https://www.cipa.jp/std/documents/download_e.html?CIPA_DC-008-2026-E), Section 3.2).

For [CIPA Multi-Picture Format (MPF)](https://www.cipa.jp/std/documents/download_e.html?CIPA_DC-007-2025_E) assets, the C2PA Manifest Store shall be embedded as the data contained in an **APP11** marker segment of the first individual image (i.e., Exif image).

<a id="_embedding_manifests_into_png"></a>
