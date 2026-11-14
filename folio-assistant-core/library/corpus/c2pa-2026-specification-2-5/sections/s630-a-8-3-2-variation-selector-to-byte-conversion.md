---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s630-a-8-3-2-variation-selector-to-byte-conversion
section_title: "A.8.3.2. Variation-Selector-to-Byte Conversion"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12083-12099
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.8.3.2. Variation-Selector-to-Byte Conversion

To decode variation selectors back to bytes:

```python
function variationSelectorToByte(codepoint vs) {
    if (vs >= U+FE00 && vs <= U+FE0F) {
        return vs - U+FE00;
    } else if (vs >= U+E0100 && vs <= U+E01EF) {
        return (vs - U+E0100) + 16;
    } else {
        return INVALID;
    }
}
```

<a id="_encoding_example"></a>
