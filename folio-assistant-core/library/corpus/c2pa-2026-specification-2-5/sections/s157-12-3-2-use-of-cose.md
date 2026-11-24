---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s157-12-3-2-use-of-cose
section_title: "12.3.2. Use of COSE"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2051-2062
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 12.3.2. Use of COSE

The signature for the CBOR-encoded claim is produced by CBOR Object Signing and Encryption (COSE) as described in [RFC 9052](https://www.rfc-editor.org/rfc/rfc9052), sections 4.2 and 4.4.

> **NOTE:**
> Payloads can either be present inside a COSE signature, or transported separately ("detached content" as described in [RFC 9052](https://www.rfc-editor.org/rfc/rfc9052), section 4.1). In "detached content" mode, the signed data is stored externally to the `COSE_Sign1_Tagged` structure, and the `payload` field of the `COSE_Sign1_Tagged` structure is always `nil`.

Regardless of whether the payload will be present in or detached from the `COSE_Sign1_Tagged` signature; the contents of the `payload` field of `Sig_structure` in memory, when constructed to compute or verify a digital signature, shall be populated with that external data as described by the particular use of digital signature in this specification. The `payload` field of `Sig_structure` shall never be `nil`.

When computing or verifying the signature of a standard or update manifest, the `payload` field of the `Sig_structure` will contain the contents of the claim JUMBF box, as described in [Section 10.3.2.4, “Signing a Claim”](#_signing_a_claim) and [Section 11.5, “Serialization”](#_serialization).

<a id="_computing_the_signature"></a>
