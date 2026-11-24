---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s223-14-9-1-determining-revocation-through-ocsp-respo
section_title: "14.9.1. Determining revocation through OCSP responses in the C2PA Manifest Store"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2915-2944
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.9.1. Determining revocation through OCSP responses in the C2PA Manifest Store

A validator shall decode OCSP responses per the requirements of [RFC 6960](https://www.rfc-editor.org/rfc/rfc6960), in particular requirements 1 through 4 of section 3.2. If an OCSP response is accepted, and if all of the following requirements are met, then this establishes that the relevant certificate was not revoked at the time of signing.

*   The claim signature has an attested time provided by a valid signed time stamp.
    
*   There exists a `SingleResponse` in the `responses` array of the `tbsResponseData` field of the OCSP response such that all of the following conditions hold:
    
    *   The current time is no earlier than `thisUpdate`.
        
    *   The attested time from the time stamp:
        
        *   is earlier than `thisUpdate`, or
            
        *   falls within the `(thisUpdate,nextUpdate)` interval, if `nextUpdate` is present, or
            
        *   falls within the `(thisUpdate,producedAt + 24 hours)` interval where `producedAt` is the field in the containing `ResponseData`, if `nextUpdate` is not present.
            
        
    *   The `certStatus` field of the `SingleResponse` is `good`.
        
    
*   The OCSP signer of the response is an "authorized responder" as defined by [RFC 6960](https://www.rfc-editor.org/rfc/rfc6960), section 4.2.2.2.
    

If the above conditions are met for any OCSP response in the C2PA Manifest Store, then the validator shall either issue a `signingCredential.ocsp.notRevoked` success code, indicating that the certificate is considered not revoked at the time of signing, or (for additional assurance) perform an online OCSP check as described in [Section 14.9.2, “Determining revocation from online OCSP response”](#ocsp_online).

Otherwise, if an OCSP response in the C2PA Manifest Store meets all of the above conditions except that the `certStatus` field is `revoked`, the certificate shall be considered revoked and the claim shall be rejected with a `signingCredential.ocsp.revoked` failure code.

<a id="ocsp_online"></a>
