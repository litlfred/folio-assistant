---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s323-15-8-1-initial-common-validation-steps
section_title: "15.8.1. Initial/Common Validation Steps"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4488-4502
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 15.8.1. Initial/Common Validation Steps

If the segment being validated is an initialization segment, the validator shall look for the presence of an `mdat` box. If an `mdat` box is found, the validation shall fail with a failure code of `livevideo.init.invalid`.

If a BMFF/CMAF segment contains neither a C2PA Manifest Box nor an `emsg` box that meets the requirements [defined above](#c2pa_emsg_box), the validation of that segment shall fail with a failure code of `livevideo.segment.invalid`.

If an E-RTMP-delivered segment is not closed by one or more `Metadata` messages carrying a `c2paSegmentInfo` that meets the requirements [defined above](#ertmp_segment), the validation of that segment shall fail with a failure code of `livevideo.segment.invalid`.

If a C2PA Manifest Box is found in a given segment, it shall be validated according to the general C2PA validation rules described in [Chapter 14, _Validation_](#validation-clause). If the C2PA Manifest fails validation, the validation of that segment shall fail with a failure code of `livevideo.manifest.invalid`.

For content contributed over [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html), when a validator validates a segment, it shall have obtained the C2PA Manifest identified by the `manifestId` field of the segment’s `rtmp-segment-info-map`, either from a `c2paManifest` \[name, value\] pair or from the `manifestUri` field of that `rtmp-segment-info-map` (see [Section 15.5.5, “Session Keys”](#session_keys)); if it has not, the validation of that segment shall fail with a failure code of `livevideo.init.invalid`. Any C2PA Manifest Store obtained this way shall be validated according to the general C2PA validation rules described in [Chapter 14, _Validation_](#validation-clause), with its hard binding validated against the E-RTMP initialization data as described in [Section 15.5.3.3, “Initialization data binding”](#ertmp_init_binding); if it fails validation, the validation of that segment shall fail with a failure code of `livevideo.manifest.invalid`.

When the hard binding of a C2PA Manifest delivered in a `c2paManifest` \[name, value\] pair is validated, the codec configuration of each track contained in the E-RTMP initialization data is bound by that C2PA Manifest. If, for any coded frame of an E-RTMP-delivered segment, the most recent codec configuration of its track received before that frame (carried in a `SequenceStart` packet or, for legacy codec signaling, the equivalent sequence header) is not the codec configuration of that track bound by the C2PA Manifest identified by the `manifestId` field of the segment’s `rtmp-segment-info-map`, the validation of that segment shall fail with a failure code of `livevideo.init.invalid`.

<a id="_per_segment_c2pa_manifest_box_validation"></a>
