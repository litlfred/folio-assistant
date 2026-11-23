---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s626-a-8-2-2-syntax
section_title: "A.8.2.2. Syntax"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12029-12041
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.8.2.2. Syntax

```none
aligned(8) class C2PATextManifestWrapper {
    unsigned int(64) magic = 0x4332504154585400;  // "C2PATXT\0"
    unsigned int(8)  version = 1;
    unsigned int(32) manifestLength;
    unsigned int(8)  jumbfContainer[manifestLength];
    unsigned int(8)  padding[];  // optional trailing padding bytes
}
```

<a id="_semantics"></a>
