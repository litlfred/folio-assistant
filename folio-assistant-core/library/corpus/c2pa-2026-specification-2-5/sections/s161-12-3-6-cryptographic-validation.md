---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s161-12-3-6-cryptographic-validation
section_title: "12.3.6. Cryptographic validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2106-2110
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 12.3.6. Cryptographic validation

When verifying a signature, an in-memory `Sig_structure` is generated. Its `body_protected` field is populated with the contents of the `protected` header bucket from the `COSE_Sign1_Tagged` structure ([RFC 9052](https://www.rfc-editor.org/rfc/rfc9052), section 4.4). For the `payload` field, if the payload was specified as present in the signature, it is populated from the `payload` field of the `COSE_Sign1_Tagged` structure. If the payload was specified as detached, the `payload` field of the `COSE_Sign1_Tagged` structure will be `nil`. In this case, the contents of the `payload` field of `Sig_structure` shall be populated from the same external source that was used in the generation of the signature. These are defined in the places where the digital signature is used in this specification.

<a id="_inclusion_of_signer_icons"></a>
