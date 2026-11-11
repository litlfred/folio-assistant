---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s221-14-8-3-validating-the-claimed-time-of-signing
section_title: "14.8.3. Validating the \"claimed time of signing\""
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2890-2894
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.8.3. Validating the "claimed time of signing"

A validator may choose to validate the "claimed time of signing" as attested by the value present in the `iat` protected header. If the `iat` header is present, the validator may validate that the attested time falls within the validity period of the signer’s certificate and all CA certificates up to the trust anchor, and not later than the time attested by any associated trusted time stamp. If the validator does the validation of this value, and it falls inside the validity period, the validator shall return the `timeOfSigning.insideValidity` informational code, but if it falls outside the validity period, then the validator shall return the `timeOfSigning.outsideValidity` informational code.

<a id="_validate_the_credential_revocation_information"></a>
