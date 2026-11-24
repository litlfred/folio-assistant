---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s282-14-12-3-2-jpeg-xl-special-handling
section_title: "14.12.3.2. JPEG-XL Special Handling"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3937-3941
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.12.3.2. JPEG-XL Special Handling

When validating JPEG-XL the C2PA Manifest Store is a top level JUMBF box (JUMB). The box containing the C2PA Manifest Store shall be identified with the special `C2PA` box identifier. The C2PA Manifest Store is identified by it being a JUMBF superbox with a label of `c2pa` and a JUMBF type UUID of `63327061-0011-0010-8000-00AA00389B71` as described in [Section 11.5, “Serialization”](#_serialization).

<a id="_font_special_handling"></a>
