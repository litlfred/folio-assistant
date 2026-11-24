---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s218-14-8-1-1-embedded-in-the-claim-signature
section_title: "14.8.1.1. Embedded in the Claim Signature"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2823-2843
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.8.1.1. Embedded in the Claim Signature

If either the `sigTst` or `sigTst2` header is present, then the `tstTokens` array is expected to contain a single `tstToken`. If the header contains more than one `tstToken`, the validator shall issue a `timeStamp.malformed` informational code and ignore the time stamps.

A validator that supports `sigTst` shall perform the following procedures to validate the time stamp response:

*   Retrieve the `val` property from the `tstToken`, which shall be an RFC3161-compliant `TimeStampResp` (time stamp response).
    
*   Check the value of the `status` field `PKIStatusInfo`, which is the value of the `status` field of `TimeStampResp`.
    
    *   If it contains any value other than `0` (`granted`) or `1` (`grantedWithMods`), the validator shall issue a `timeStamp.malformed` informational code and ignore that time stamp.
        
    *   If it is either `0` (`granted`) or `1` (`grantedWithMods`), continue with the rest of the time stamp validation process as described below.
        
    
*   Retrieve the value of the `timeStampToken` field of the `TimeStampResp` for use in the remainder of the validation process.
    

A validator for `sigTst2` shall retrieve the `val` property from the `tstToken`, which shall be an RFC3161-compliant `timeStampToken` (TimeStampToken, TST).

<a id="_referenced_by_a_time_stamp_assertion"></a>
