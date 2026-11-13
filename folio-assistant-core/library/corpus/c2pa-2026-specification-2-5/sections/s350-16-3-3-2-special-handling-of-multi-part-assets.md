---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s350-16-3-3-2-special-handling-of-multi-part-assets
section_title: "16.3.3.2. Special handling of multi-part assets"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 5362-5368
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.3.2. Special handling of multi-part assets

To support file formats that consist of multiple parts (as described in [Section 16.3.5, “Multi-Asset Hash”](#_multi_asset_hash)), one additional logical box is defined for cases where the data of one or more parts comes after the box-based data of the primary part. This box shall be labelled `c2pa.after` (for arbitrary data beyond the end of the box structure). The `c2pa.after` box, if present, shall be the last box listed, and its hash shall be computed from the byte following the last box until the end of the physical file.

The hard binding assertion, which covers the whole asset, shall be the only assertion that can include a `c2pa.after` box. A hash assertion for an individual part shall cover only the contents of that part itself, and not any other part.

<a id="_handling_for_specific_formats"></a>
