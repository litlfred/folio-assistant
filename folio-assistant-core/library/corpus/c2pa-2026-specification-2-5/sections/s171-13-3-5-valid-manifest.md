---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s171-13-3-5-valid-manifest
section_title: "13.3.5. Valid Manifest"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2185-2202
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 13.3.5. Valid Manifest

A C2PA Manifest is Valid if validation determines that each of the following is true:

*   The manifest is Well-Formed \[[Section 13.3.4, “Well-Formed Manifest”](#_well_formed_manifest)\].
    
*   The manifest has not been modified since the manifest was signed \[[Section 12.3.6, “Cryptographic validation”](#_cryptographic_validation)\].
    
*   The claim signature receives a success code of `claimSignature.validated` \[[Section 14.7, “Validate the Signature”](#_validate_the_signature)\].
    
*   Validation of the claim signature validity period receives the success code of `claimSignature.insideValidity` \[[Section 14.8, “Validate the Time Stamp”](#_validate_the_time_stamp)\].
    
*   The credential of the signer of the C2PA Manifest is not rejected with a failure code of `signingCredential.ocsp.revoked` \[[Section 14.9, “Validate the Credential Revocation Information”](#_validate_the_credential_revocation_information)\].
    

If a C2PA Manifest is Valid, then the manifest’s claim can be attributed to the claim generator which is identified by the `claim_generator_info` field of the claim \[[Section 10.2.3, “Claim Generator Info”](#_claim_generator_info)\].

<a id="_trusted_manifest"></a>
