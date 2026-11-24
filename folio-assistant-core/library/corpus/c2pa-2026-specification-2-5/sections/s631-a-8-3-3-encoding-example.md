---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s631-a-8-3-3-encoding-example
section_title: "A.8.3.3. Encoding Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12100-12115
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.8.3.3. Encoding Example

The non-normative example at [Table 13, “Encoding Example”](#encoding-example) illustrates the use of `byteToVariationSelector` for representative byte values. Each row gives the source byte, the resulting Unicode code point, and its UTF-8 encoding.

**Table 13. Encoding Example**

| Byte | Code point | UTF-8 (hex) |
| --- | --- | --- |
| `0x00` | U+FE00 | `EF B8 80` |
| `0x0F` | U+FE0F | `EF B8 8F` |
| `0x10` | U+E0100 | `F3 A0 84 80` |
| `0xFF` | U+E01EF | `F3 A0 87 AF` |

The eight-byte `magic` value `C2PATXT\0` (`0x43 0x32 0x50 0x41 0x54 0x58 0x54 0x00`) therefore encodes to the code point sequence `U+E0133 U+E0122 U+E0140 U+E0131 U+E0144 U+E0148 U+E0144 U+FE00`. A validator decodes these eight variation selectors with `variationSelectorToByte` and compares the result against the `magic` value to identify a candidate wrapper.

<a id="_placement_and_detection_strategy"></a>
