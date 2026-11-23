---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s214-14-6-2-validating
section_title: "14.6.2. Validating"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2777-2799
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.6.2. Validating

If the content of the claim is not well-formed CBOR, the claim shall be rejected with a failure code of `claim.cbor.invalid`.

> **NOTE:**
> Well-formed CBOR is defined in [RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), Appendix C.

For a "c2pa.claim.v2", the following fields are expected to be present in the CBOR object. If any are absent, then the claim shall be rejected with a failure code of `claim.malformed`.

*   `instanceID`
    
*   `signature`
    
*   `created_assertions`
    
*   `claim_generator_info`
    

If the `claim_generator_info` field does not contain a `name` field, the claim shall be rejected with a failure code of `claim.malformed`.

If there is an `icon` field in the `generator-info-map` referenced by the `claim_generator_info` field of the `claim-map` or `claim-map-v2`, then its value shall be validated as described in [Section 14.10.4.3, “Validation of References”](#_validation_of_references).

<a id="_validate_the_signature"></a>
