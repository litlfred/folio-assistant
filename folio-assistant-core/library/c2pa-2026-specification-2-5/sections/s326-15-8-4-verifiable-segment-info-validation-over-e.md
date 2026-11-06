---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s326-15-8-4-verifiable-segment-info-validation-over-e
section_title: "15.8.4. Verifiable Segment Info Validation over Enhanced RTMP"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4546-4565
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 15.8.4. Verifiable Segment Info Validation over Enhanced RTMP

For content contributed over [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html), the validation steps described in [Verifiable Segment Info Validation](#_verifiable_segment_info_validation) apply, with the `VideoPacketType.Metadata` or `AudioPacketType.Metadata` message carrying `c2paSegmentInfo` used in place of the `emsg` box, and the ``rtmp-segment-info-map’s `segmentHash`` field (see [Section 15.5.3, “Carriage over Enhanced RTMP (E-RTMP)”](#rtmp_verifiable_segment_info)) used in place of `bmffHash`. Session keys are delivered in `c2pa.session-keys` in a `c2paManifest` metadata message.

Subsequently, when parsing the `rtmp-segment-info-map`, validation of that segment shall fail with a failure code of `livevideo.segment.invalid` if any of the following errors occurs:

*   the segment is not the first segment of its track, and its `sequenceNumber` is lower than or equal to the `sequenceNumber` of the previous segment of the same track;
    
*   the segment’s `sequenceNumber` is lower than the `minSequenceNumber` (of the matching session key);
    
*   the time at which the segment is validated is outside the key’s validity period, that is, earlier than `createdAt` or later than `createdAt` plus `validityPeriod` seconds;
    
*   the segment’s hash does not match the `segmentHash` field;
    
*   the session key identified by `kid` has already been used to sign the `rtmp-verifiable-segment-info` of a different track (that is, of a different combination of `mediaType` and `trackId`);
    
*   the `Metadata` message carrying the `rtmp-verifiable-segment-info` does not belong to the track identified by its `mediaType` and `trackId` fields (see [Section 15.5.3.1, “Logical segment”](#ertmp_segment)).
    

<a id="_c2pa_standard_assertions"></a>
