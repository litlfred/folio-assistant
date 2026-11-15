---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s281-14-12-3-1-jpeg-1-special-handling
section_title: "14.12.3.1. JPEG 1 Special Handling"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3930-3936
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.12.3.1. JPEG 1 Special Handling

When validating a JPEG 1 asset, a validator shall check that each box identified with the special `C2PA` box identifier is indeed an `APP11` containing some or all of the C2PA Manifest Store. The C2PA Manifest Store is identified by it being a JUMBF superbox with a label of `c2pa` and a JUMBF type UUID of `63327061-0011-0010-8000-00AA00389B71` as described in [Section 11.5, “Serialization”](#_serialization).

If an `APP11` that is not part of the C2PA Manifest Store is present and not included in the list of hashed boxes, then the manifest shall be rejected with a failure code of `assertion.boxesHash.unknownBox`.

<a id="_jpeg_xl_special_handling"></a>
