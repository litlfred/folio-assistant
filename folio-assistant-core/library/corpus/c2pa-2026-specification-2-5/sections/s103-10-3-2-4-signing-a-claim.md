---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s103-10-3-2-4-signing-a-claim
section_title: "10.3.2.4. Signing a Claim"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1427-1435
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 10.3.2.4. Signing a Claim

Producing the signature is specified in [Section 12.3, “Digital Signatures”](#_digital_signatures).

For both types of manifests, standard and update, the `payload` field of `Sig_structure` shall be the serialized CBOR of the claim document, and shall use detached content mode.

The serialized `COSE_Sign1_Tagged` structure resulting from the digital signature procedure is written into the C2PA Claim Signature box.

<a id="_time_stamps"></a>
