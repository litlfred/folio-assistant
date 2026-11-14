---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s109-10-3-2-6-credential-revocation-information
section_title: "10.3.2.6. Credential Revocation Information"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1510-1514
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 10.3.2.6. Credential Revocation Information

If the signer’s credential supports querying its online credential status, and the credential contains a pointer to a service that provides credential status information with a time stamp, the claim generator should query the service, capture the response, and store it in the manner described for credentials in the [Trust Model](#_trust_model). If credential revocation information is attached in this manner, a trusted time stamp shall also be obtained after signing, as described in [Section 10.3.2.5, “Time Stamps”](#_time_stamps).

<a id="_examples_of_claims"></a>
