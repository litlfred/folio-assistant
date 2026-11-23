---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s222-14-9-validate-the-credential-revocation-informat
section_title: "14.9. Validate the Credential Revocation Information"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2895-2914
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 14.9. Validate the Credential Revocation Information

Discovery of the revocation status of the signer’s certificate and all CA certificates that are part of the trust chain is important to determining whether a given certificate is considered valid and trusted.

For CA certificates, the validator should determine revocation status as indicated in the Authority Information Access (AIA) extension as described in [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280), section 4.2.2.1. The validator should make use of relevant OCSP responses included in the C2PA Manifest if the AIA extension indicates that OCSP is available.

If the validator determines that a CA certificate was revoked at the time indicated in a trusted time stamp, or at the current time if no trusted time stamp is present, then the claim signature shall be rejected with a failure status of `signingCredential.untrusted`.

For the signer’s certificate, the validator shall use the following process.

*   If a certificate does not support revocation status, or the certificate issuer did not provide a method to query its revocation status, the validator shall treat the credential as not revoked.
    
*   If the claim generator "stapled" OCSP responses in the `rVals` header of the `COSE_Sign1` structure, the validator shall decode and validate the stapled OCSP responses as described in [Section 14.9.1, “Determining revocation through OCSP responses in the C2PA Manifest Store”](#ocsp_stapled).
    
*   If subsequent claim generators added [certificate status assertions](#certificate_status_assertion) in other C2PA Manifests in the C2PA Manifest Store, the validator shall use those OCSP response(s) in the validation process described in [Section 14.9.1, “Determining revocation through OCSP responses in the C2PA Manifest Store”](#ocsp_stapled). If more than one OCSP response for the certificate is found, the validator shall try each one until one successfully passes validation (and then should ignore the others).
    

If no revocation information was found in the C2PA Manifest Store, and the validator is online, then the validator should attempt to determine the revocation status of the certificate by querying the OCSP responder as described in [Section 14.9.2, “Determining revocation from online OCSP response”](#ocsp_online).

<a id="ocsp_stapled"></a>
