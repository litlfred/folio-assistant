---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s108-10-3-2-5-4-storing-the-time-stamp
section_title: "10.3.2.5.4. Storing the time stamp"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1481-1509
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 10.3.2.5.4. Storing the time stamp

v1 time stamps (deprecated) are stored in a COSE unprotected header whose label is the string `sigTst`. If present, the value of this header shall be a `tstContainer` defined by [Section G.2.2, “Timestamp Container”](#cddl_annex_tst_container). The content of the `TimeStampResp` structure received in reply from the TSA shall be stored as the value of the `val` property of an element of `tstTokens`.

v2 time stamps shall be stored in a COSE unprotected header whose label is the string `sigTst2`. When present, the value of this header shall be a `tstContainer` defined by [Section G.2.2, “Timestamp Container”](#cddl_annex_tst_container). The value of the `timeStampToken` field of the `TimeStampResp` structure received in reply from the TSA shall be stored as the value of the `val` property of an element of `tstTokens`. It shall be formatted as a DER-encoded [RFC 3161](https://www.rfc-editor.org/rfc/rfc3161) `TimeStampToken` wrapped in a CBOR byte string.

> **NOTE:**
> A v2 time stamp is equivalent to the "CTT" model of [COSE Header parameter for RFC 3161 Time-Stamp Tokens Draft](https://datatracker.ietf.org/doc/draft-ietf-cose-tsa-tst-header-parameter/). It requires that the complete signature structure be completed prior to time stamping, thus enabling the time stamp to serve as a countersignature on the entire signature structure, including the actual certificate.

If no time stamps are included, then neither header (`sigTst` nor `sigTst2`) shall be present in the COSE unprotected header.

The `tstContainer` schema is defined in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.2.2, “Timestamp Container”](#cddl_annex_tst_container) for the complete normative schema):

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
> The `tstContainer` schema (see [Section G.2.2, “Timestamp Container”](#cddl_annex_tst_container)) is a CBOR adaptation of a subset of the schema from [JAdES](https://www.etsi.org/deliver/etsi_ts/119100_119199/11918201/01.01.01_60/ts_11918201v010101p.pdf), section 5.3.4 and [its JSON schema](https://forge.etsi.org/rep/esi/x19_182_JAdES/raw/v1.1.1/19182-jsonSchema.json), except with the modification that the content of `val` is a byte string and not a Base64-encoded string.

<a id="_credential_revocation_information"></a>
