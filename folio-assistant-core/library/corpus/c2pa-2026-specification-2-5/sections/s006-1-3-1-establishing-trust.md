---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s006-1-3-1-establishing-trust
section_title: "1.3.1. Establishing Trust"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 57-61
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 1.3.1. Establishing Trust

The basis of making trust decisions in C2PA, our [trust model](#_trust_model), is the identity of the signer associated with the cryptographic signing key used to sign a claim in a C2PA Manifest. The claim signatures of C2PA Manifests, when combined with trusted time stamps, can undergo the validation process indefinitely to determine if claims were signed while the signing credentials were valid and not revoked.

<a id="_an_example"></a>
