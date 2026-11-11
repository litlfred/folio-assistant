---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s102-10-3-2-3-connecting-the-signature
section_title: "10.3.2.3. Connecting the Signature"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1419-1426
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 10.3.2.3. Connecting the Signature

The signature cannot be part of the signed payload, but since its label is pre-defined, then the full URI reference is also known. As such, we can include that in the claim by setting the value of the `signature` field of the claim to that URI reference.

> **NOTE:**
> This provides the explicit binding of the claim to its signature.

<a id="_signing_a_claim"></a>
