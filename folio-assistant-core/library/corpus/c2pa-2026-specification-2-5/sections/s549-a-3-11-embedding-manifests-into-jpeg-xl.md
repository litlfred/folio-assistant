---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s549-a-3-11-embedding-manifests-into-jpeg-xl
section_title: "A.3.11. Embedding manifests into JPEG XL"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11043-11051
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.3.11. Embedding manifests into JPEG XL

As described in ISO/IEC 18181-2:2024, Clause 4, JPEG XL supports two different formats for the data. It may use a box structure that is compatible with JPEG 2000 and JPEG XS or it may be a direct JPEG XL codestream without the box structure. A JPEG XL file that uses the box structure shall contain at most one JUMBF (`jumb`) superbox (ISO/IEC 18181-2:2024, Clause 9.3) containing one C2PA Manifest JUMBF Box, which contains the C2PA Manifest Store as described in [Section 11.5, “Serialization”](#_serialization). A JPEG XL file that is only a codestream is unable to include an embedded C2PA Manifest. The manifest store shall exist in its own top level JUMBF (`jumb`) and not shared with any other JUMBF boxes.

![A C2PA Manifest embedded in a JPEG XL image](_images/Manifest-in-JXL.drawio.png)

Figure 19. A C2PA Manifest embedded in a JPEG XL image

<a id="_embedding_manifests_into_fonts"></a>
