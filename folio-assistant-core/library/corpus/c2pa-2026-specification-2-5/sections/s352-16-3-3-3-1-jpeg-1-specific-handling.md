---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s352-16-3-3-3-1-jpeg-1-specific-handling
section_title: "16.3.3.3.1. JPEG 1-specific Handling"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 5372-5383
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.3.3.3.1. JPEG 1-specific Handling

When working with JPEG 1, the `APP11` box is used for standards other than C2PA (i.e., JPEG 360). In those situations, all non-C2PA `APP11` boxes shall be included in the list of hashed boxes. The `APP11` boxes containing the C2PA Manifest Store shall be identified by `C2PA`. All other boxes shall be identified by the symbol found in [ISO 10918-1:1994, Table B.1](https://www.iso.org/standard/18902.html).

The C2PA Manifest Store can be identified by it being a JUMBF superbox with a label of `c2pa` and a JUMBF type UUID of `63327061-0011-0010-8000-00AA00389B71` as described in [Section 11.5, “Serialization”](#_serialization).

> **NOTE:**
> The Start of Scan box and Restart boxes, label of `SOS` and `RST[n]`, will include the entropy coded segments following the respective marker.

The [CIPA Multi-Picture Format (MPF)](https://www.cipa.jp/std/documents/download_e.html?CIPA_DC-007-2025_E) extension to JPEG 1 can also be supported using this method by listing all boxes contained in the file as they appear, assuming there is no data between the `EOI` of one Individual Image and the `SOI` of the next. The `boxes` list would enumerate the segments from each Individual Image in the MPF in sequence (`SOI`, …​, `EOI`, `SOI`, …​, `EOI`, …​). However, if the claim generator plans to treat the MPF file as a multi-part asset, then the `c2pa.after` box shall be used to hash the additional parts that follow the `EOI` of the first Individual Image (the primary part).

<a id="_png_specific_handling"></a>
