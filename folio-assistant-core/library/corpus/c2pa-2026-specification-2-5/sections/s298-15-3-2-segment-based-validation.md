---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s298-15-3-2-segment-based-validation
section_title: "15.3.2. Segment-based validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4106-4119
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 15.3.2. Segment-based validation

Live media, or dynamically packaged, streams require the validation of each segment of the stream independently of other segments. As such, the hash of each segment’s content needs to be provided as part of that segment. Two different methods for signing that information are described, enabling a given claim generator to choose the most appropriate one for its needs. Either method can be used, and validators are not required to support both.

These methods are:

*   "[Section 15.4, “Per-segment C2PA Manifest Box method”](#using_c2pa_manifest_box)" which uses a standard C2PA Manifest Box in each segment.
    
*   "[Section 15.5, “Verifiable Segment Info method”](#verifiable_segment_info)" which uses a `verifiable-segment-info`, carried in an `emsg` box (for BMFF/CMAF content) or in an E-RTMP `VideoPacketType.Metadata` or `AudioPacketType.Metadata` message (for content contributed over [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html)), along with session keys.
    

Other C2PA-defined live media binding schemes (for example, per-segment manifest box-based schemes that derive per-segment validation values by chaining across segments) may also be used, provided that they (a) compute segment hashes using a standard `bmff-hash-map` as defined by this specification and (b) embed or reference a C2PA Manifest Store using a `uuid` box as described in [Section A.5.1, “The `'uuid'` Box for C2PA”](#uuid_box).

<a id="_c2pa_manifest_binding_in_an_initialization_segment"></a>
