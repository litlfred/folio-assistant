---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s715-g-2-2-timestamp-container
section_title: "G.2.2. Timestamp Container"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14024-14041
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.2.2. Timestamp Container

```cddl
; CBOR version of tstContainer and related structures based on JSON schema at
; https://forge.etsi.org/rep/esi/x19_182_JAdES/raw/v1.1.1/19182-jsonSchema.json
tstContainer = {
  "tstTokens": [1* tstToken]
}

tstToken = {
  "val": bstr
}
```

> **NOTE:**
> This definition is a CBOR adaptation of a subset of the schema from [JAdES](https://www.etsi.org/deliver/etsi_ts/119100_119199/11918201/01.01.01_60/ts_11918201v010101p.pdf), section 5.3.4 and [its JSON schema](https://forge.etsi.org/rep/esi/x19_182_JAdES/raw/v1.1.1/19182-jsonSchema.json), except with the modification that the content of `val` is a byte string and not a Base64-encoded string.

<a id="_uri_types"></a>
