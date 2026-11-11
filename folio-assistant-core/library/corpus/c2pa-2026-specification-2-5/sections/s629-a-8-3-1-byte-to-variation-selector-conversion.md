---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s629-a-8-3-1-byte-to-variation-selector-conversion
section_title: "A.8.3.1. Byte-to-Variation-Selector Conversion"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12068-12082
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.8.3.1. Byte-to-Variation-Selector Conversion

Each byte of the wrapped manifest shall be converted to a Unicode variation selector using the following algorithm:

```python
function byteToVariationSelector(byte b) {
    if (b >= 0 && b <= 15) {
        return U+FE00 + b;
    } else if (b >= 16 && b <= 255) {
        return U+E0100 + (b - 16);
    }
}
```

<a id="_variation_selector_to_byte_conversion"></a>
