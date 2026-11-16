---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s159-12-3-4-adding-a-claimed-time-of-signing
section_title: "12.3.4. Adding a claimed time of signing"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2090-2100
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 12.3.4. Adding a claimed time of signing

A claim generator may also wish to establish a "claimed time of signing" by adding an `iat` protected header, whose value is a `NumericDate`. If present, it shall represent the time at which the signature was generated.

> **NOTE:**
> A `NumericDate` is a CBOR numeric date (as described in [RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), section 3.4.2) but with the leading tag 1 (epoch-based date/time) omitted. It is not used anywhere else in this specification.

> **NOTE:**
> This recommendation is based on in-process updates to [JAdES](https://www.etsi.org/deliver/etsi_ts/119100_119199/11918201/01.01.01_60/ts_11918201v010101p.pdf) for providing a claim generator provided timestamp that is not used for certificate validity checking, but could be used in a user experience. It could be useful in scenarios where the claim generator is not able to access a trusted time source, but still wants to provide a time of signing.

<a id="_signature_validation"></a>
