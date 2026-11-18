---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s635-a-8-5-deterministic-wrapper-padding
section_title: "A.8.5. Deterministic Wrapper Padding"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12159-12164
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.8.5. Deterministic Wrapper Padding

> **NOTE:**
> The UTF-8 byte length of a `C2PATextManifestWrapper` depends on the byte distribution of the encoded manifest. Bytes in the range 0x00-0x0F map to base Variation Selectors (U+FE00-U+FE0F), which encode to 3 UTF-8 bytes. Bytes in the range 0x10-0xFF map to supplementary Variation Selectors (U+E0100-U+E01EF), which encode to 4 UTF-8 bytes. Because the `c2pa.hash.data` exclusion must specify the wrapper’s byte range, and the hash value influences the manifest bytes, a circular dependency exists between the exclusion length and the wrapper byte length. Deterministic padding resolves this by computing the exclusion length from the manifest byte count alone.

<a id="_worst_case_encoding_formula"></a>
