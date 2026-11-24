---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s160-12-3-5-signature-validation
section_title: "12.3.5. Signature Validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2101-2105
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 12.3.5. Signature Validation

When producing a signature, if the claim generator can also act as a validator, the claim generator should validate that the signing credential is acceptable according to [Chapter 13, _Trust Model_](#_trust_model) and produce a warning if it is not. The claim generator may still allow signing with that credential if so desired. This may be desirable if it is known that the local claim generator’s validator has a different configuration than validators used by the expected audience of the asset.

<a id="_cryptographic_validation"></a>
