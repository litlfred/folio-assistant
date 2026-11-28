---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s324-15-8-2-per-segment-c2pa-manifest-box-validation
section_title: "15.8.2. Per-segment C2PA Manifest Box Validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4503-4518
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 15.8.2. Per-segment C2PA Manifest Box Validation

If the C2PA Manifest present in the C2PA Manifest Box contains a live media segment assertion, the validator shall perform the following tests:

*   Unless the segment is the first segment, ensure that the `sequenceNumber` field in the live media segment assertion is greater than the `sequenceNumber` of the previous segment. If it is not, the validation of that segment shall fail with a failure code of `livevideo.assertion.invalid`.
    
*   Ensure that the `streamId` field in the live media segment assertion matches the `streamId` from the previous segment (if any). If they do not match, the validation of that segment shall fail with a failure code of `livevideo.assertion.invalid`.
    
*   Ensure that the `continuityMethod` field is present in the live media segment assertion. If it is not, the validation of that segment shall fail with a failure code of `livevideo.continuityMethod.invalid`.
    
*   If the `continuityMethod` field in the live media segment assertion has a value of "c2pa.manifestId", then the live media segment assertion shall contain a `previousManifestId` field. If it does not, the validation of that segment shall fail with a failure code of `livevideo.continuityMethod.invalid`. If it does, then ensure that its value matches the `manifestId` of the previous segment’s C2PA Manifest. If they do not match, the validation of that segment shall fail with a failure code of `livevideo.segment.invalid`.
    
*   If the `continuityMethod` field in the live media segment assertion has a value other than "c2pa.manifestId", and the validator does not recognize or support that continuity method, the validation of that segment shall fail with a failure code of `livevideo.continuityMethod.invalid`.
    

<a id="_verifiable_segment_info_validation"></a>
