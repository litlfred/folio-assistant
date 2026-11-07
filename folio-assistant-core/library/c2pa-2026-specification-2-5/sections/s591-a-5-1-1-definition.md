---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s591-a-5-1-1-definition
section_title: "A.5.1.1. Definition"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11521-11535
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.5.1.1. Definition

```none
Box Type: 'uuid'
Extended Box Type: 0xD8, 0xFE, 0xC3, 0xD6, 0x1B, 0x0E, 0x48, 0x3C, 0x92, 0x97, 0x58, 0x28, 0x87, 0x7E, 0xC4, 0x81
Version: 0
Flags: 0
Container: File
Mandatory: No
Quantity: Zero or more
```

C2PA’s `'uuid'` box embeds provenance into BMFF. One such box contains a C2PA Manifest Store, and there may be one or more auxiliary boxes containing additional information required for validation.

<a id="_syntax_2"></a>
