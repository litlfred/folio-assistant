---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s636-a-8-5-1-worst-case-encoding-formula
section_title: "A.8.5.1. Worst-Case Encoding Formula"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12165-12192
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.8.5.1. Worst-Case Encoding Formula

For a manifest of _M_ bytes, the deterministic target wrapper byte length is:

```python
HEADER_SIZE = 8 + 1 + 4    // magic + version + manifestLength (13)
E_target = 3 + (HEADER_SIZE + M) * 4 + 6
```

Where:

*   `3` = UTF-8 byte length of the ZWNBSP prefix (U+FEFF)
    
*   `HEADER_SIZE` = 8 (magic) + 1 (version) + 4 (manifestLength) = 13 bytes
    
*   `4` = maximum UTF-8 byte length per Variation Selector character
    
*   `6` = padding margin to guarantee the gap between the target and the actual unpadded wrapper length is always expressible as a linear combination of 3 and 4 (the two possible VS character byte widths)
    

This value depends only on the manifest byte count, not on the byte distribution, and is therefore deterministic.

> **NOTE:**
> The margin of 6 is necessary because the gap between the worst-case and actual byte lengths equals the count of bytes in the range 0x00-0x0F (which encode to 3-byte base Variation Selectors instead of 4-byte supplementary ones). The values 1, 2, and 5 cannot be expressed as `3a + 4b` for non-negative integers `a` and `b`. Adding 6 shifts the minimum achievable gap to 6, ensuring all possible gaps are representable.
>
> The header always contains at least two bytes in the range 0x00-0x0F (the null byte in the magic sequence and the version byte 0x01). For manifests of fewer than 1,048,576 bytes, the four-byte big-endian length field contributes additional low-range bytes, bringing the total header contribution to at least 4. Combined with the +6 margin, the gap is always representable.

<a id="_claim_generator_procedure"></a>
