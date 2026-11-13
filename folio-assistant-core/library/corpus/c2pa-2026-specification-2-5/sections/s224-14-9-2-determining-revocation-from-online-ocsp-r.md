---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s224-14-9-2-determining-revocation-from-online-ocsp-r
section_title: "14.9.2. Determining revocation from online OCSP response"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2945-2986
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.9.2. Determining revocation from online OCSP response

If, for a given certificate, no OCSP response in the C2PA Manifest Store satisfies the conditions in [Section 14.9.1, “Determining revocation through OCSP responses in the C2PA Manifest Store”](#ocsp_stapled), or if the claim signature does not have a time stamp, the validator may choose to query the OCSP responder, per [RFC 6960](https://www.rfc-editor.org/rfc/rfc6960), with the responder `accessLocation` found via [RFC 6960](https://www.rfc-editor.org/rfc/rfc6960), section 3.1.

> **NOTE:**
> Querying the credential status method can reveal to an observer the identity of the asset being validated, and so this query is optional.

If the validator chooses not to perform an online OCSP check, it shall issue a `signingCredential.ocsp.skipped` informational code.

If the validator attempts to query the OCSP responder but is unable to receive a response, the validator shall issue a `signingCredential.ocsp.inaccessible` informational code.

If a response is received and accepted per the requirements 1 - 4 of [RFC 6960](https://www.rfc-editor.org/rfc/rfc6960), section 3.2, it shall establish the signer’s certificate was not revoked at the time of signing if either of the following requirements is fulfilled:

*   The claim signature has a valid time stamp, and the attested time falls within the `(thisUpdate,nextUpdate)` interval of the response, or
    
*   The claim signature does not have a valid time stamp but the current real-world time falls within the `(thisUpdate,nextUpdate)` interval of the response,
    

And both of the following requirements are fulfilled:

*   The `certStatus` field of the response is `good`, or `revoked` but with a `revocationReason` of `removeFromCRL`, and
    
*   The OCSP signer of the response is an "authorized responder" as defined by [RFC 6960](https://www.rfc-editor.org/rfc/rfc6960), section 4.2.2.2.
    

If the `certStatus` field of the response is `revoked` but with a `revocationReason` that is not `removeFromCRL`, it shall establish the signer’s certificate was not revoked at the time of signing if both of the following requirements are met:

*   The manifest has a valid time stamp, and the attested time falls within the `(thisUpdate,nextUpdate)` interval of the response, and
    
*   The `revocationTime` in the response is after the attested time stamp.
    

If the above conditions are met, the certificate shall be considered not revoked at the time of signing, and the validator shall issue a `signingCredential.ocsp.notRevoked` success code.

Otherwise:

*   If the `certStatus` field of the response is `unknown`, a `signingCredential.ocsp.unknown` informational code shall be recorded.
    
*   Else, the certificate shall be considered revoked and the claim shall be rejected with a `signingCredential.ocsp.revoked` failure code.
    

<a id="_validate_the_assertions"></a>
