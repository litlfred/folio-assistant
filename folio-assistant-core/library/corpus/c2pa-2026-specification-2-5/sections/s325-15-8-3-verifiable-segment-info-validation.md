---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s325-15-8-3-verifiable-segment-info-validation
section_title: "15.8.3. Verifiable Segment Info Validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4519-4545
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 15.8.3. Verifiable Segment Info Validation

If the C2PA Manifest present in the C2PA Manifest Box contains a session keys assertion, the public session keys shall be extracted and stored for use in validating subsequent segments. If any public session key does not conform to the requirements described in [Session Keys Assertion](#session_keys_assertion), the validation of that segment shall fail with a failure code of `livevideo.sessionkey.invalid`. Similarly, if signature validation (`signerBinding`) of any public session key structure fails, that session key is invalid and shall not be used to validate any media segment, and validation shall fail with a failure code of `livevideo.sessionkey.invalid`.

If a segment contains an `emsg` box that meets the requirements [defined above](#c2pa_emsg_box), and the segment is not an initialization segment, and the validator does not have any valid session keys, the validation of that segment shall fail with a failure code of `livevideo.segment.invalid`.

If there is a valid `emsg` box containing a valid `verifiable-segment-info`, the validator shall extract the value of `kid` from its unprotected header and use that to identify the correct public session key. If such key is not available, and if the `manifestUri` field is present, the validator retrieves and verifies the applicable manifest, extracting the public session key(s) as explained above.

> **NOTE:**
> There may not be valid session keys for a variety of reasons including (but not limited to) if the initialization segment containing the session keys assertion was not received, if a C2PA Manifest (containing the session keys) failed validation, or if the keys have expired.

Validation fails if the key cannot be found or if the signature in `verifiable-segment-info` cannot be verified with it, and shall fail with a failure code of `livevideo.segment.invalid`.

Subsequently, when parsing the `segment-info-map`, validation of that segment shall fail with a failure code of `livevideo.segment.invalid` if any of the following errors occurs:

*   the segment is not the first segment, and its `sequenceNumber` is lower than or equal to the `sequenceNumber` of the previous segment;
    
*   the segment’s `sequenceNumber` is lower than the `minSequenceNumber` (of the matching session key);
    
*   for BMFF/CMAF content, the segment’s presentation time is outside the key’s validity period;
    
*   the segment’s hash does not match the `bmffHash` field (see [Section 16.3.2, “BMFF-Based Hash”](#_bmff_based_hash)).
    

To address the risk of the Claim Generator’s certificate getting revoked during a very long lived session, the validator should check that the certificate used to sign the C2PA Manifest from which the current session key was retrieved is still valid. If it is not, the validation of that segment shall fail with a failure code of `livevideo.sessionkey.invalid`.

<a id="_verifiable_segment_info_validation_over_enhanced_rtmp"></a>
