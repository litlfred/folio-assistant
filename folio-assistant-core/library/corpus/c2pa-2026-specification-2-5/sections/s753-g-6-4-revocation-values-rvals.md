---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s753-g-6-4-revocation-values-rvals
section_title: "G.6.4. Revocation Values (`rVals`)"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 15793-15807
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.6.4. Revocation Values (`rVals`)

```cddl
; CBOR version of rVals and related structures based on JSON schema in
; https://www.etsi.org/deliver/etsi_ts/119100_119199/11918201/01.01.01_60/ts_11918201v010101p.pdf
; section 5.3.5.2
rVals = {
  "ocspVals": [1* bstr]
}
```

> **NOTE:**
> This definition is a CBOR adaptation of a subset of the schema from [JAdES](https://www.etsi.org/deliver/etsi_ts/119100_119199/11918201/01.01.01_60/ts_11918201v010101p.pdf), section 5.3.5.2, which only stores OCSP responses, and stores them as binary strings.

<a id="_common_types"></a>
