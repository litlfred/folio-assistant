---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s107-10-3-2-5-3-obtaining-the-time-stamp
section_title: "10.3.2.5.3. Obtaining the time stamp"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1459-1480
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 10.3.2.5.3. Obtaining the time stamp

All time stamps shall be obtained as described in [RFC 3161](https://www.rfc-editor.org/rfc/rfc3161) with the following additional requirements:

*   The `MessageImprint` of the `TimeStampReq` structure ([RFC 3161](https://www.rfc-editor.org/rfc/rfc3161), section 2.4.1) shall be computed by creating the `ToBeSigned` value in [RFC 9052](https://www.rfc-editor.org/rfc/rfc9052), section 4.4, with the following values for elements of `Sig_structure`:
    
    *   The `context` element shall be `CounterSignature`.
        
    *   The `payload` element shall be the value described by [Section 10.3.2.5.2, “Choosing the Payload”](#_choosing_the_payload).
        
    *   The remaining elements of `Sig_structure` are as described in [Section 12.3.3, “Computing the Signature”](#_computing_the_signature).
        
    
*   The `ToBeSigned` value is then hashed using a hash algorithm from the allowed list in [Section 12.1, “Hashing”](#_hashing) that the TSA supports, and that hash algorithm and value are placed in the `MessageImprint`. If the TSA does not support any hash algorithms from the allowed list, it cannot be used for time stamping.
    
    *   Where possible, the hash algorithm should use the same hash algorithm used in the digital signature of the claim.
        
    
*   The `certReq` boolean of the `TimeStampReq` structure shall be asserted in the request to the TSA, to ensure its certificate chain is provided in the response.
    

<a id="_storing_the_time_stamp"></a>
