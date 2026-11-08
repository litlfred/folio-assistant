---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s321-15-7-2-verifiable-segment-info-method
section_title: "15.7.2. Verifiable Segment Info method"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4463-4484
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 15.7.2. Verifiable Segment Info method

When using the Verifiable Segment Info method, there are two main steps involved in generating the live media stream.

Session Key Generation

At the start of a live media session, one or more session keys are generated, each with its own `createdAt`, `validityPeriod`, and `minSequenceNumber`. These session keys are included in the C2PA Manifest in the C2PA Manifest Box that shall be present in the initialization segment(s), or in an E-RTMP `VideoPacketType.Metadata` or `AudioPacketType.Metadata` message. The `minSequenceNumber` for each key indicates the earliest segment that should be signed with that key, ensuring a clear transition between keys and supporting overlap for seamless key rotation.

> **NOTE:**
> For content contributed over [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html), each track (video, audio, etc.) uses its own session key (see [Section 15.5.3.1, “Logical segment”](#ertmp_segment)).

> **NOTE:**
> For limited-duration live media streams, a single session key could be sufficient. For longer live media streams (e.g., 24/7 streams), session keys are rotated periodically by delivering new session keys in subsequent initialization segments before the old session keys expire.

Signing the Box Hash

For BMFF/CMAF content, each segment of a live media or dynamically packaged stream shall have an `emsg` box containing the `verifiable-segment-info`, which is a `segment-info-map` signed by a session key. The `segment-info-map` carries a `sequenceNumber` to address out-of-order attacks, and carries a `bmff-hash-map` that hashes the content in the segment. When manifests change during the live media stream, the updated manifest may be included in a C2PA Manifest Box in the segment or referenced via the `manifestUri` of the `segment-info-map`.

> **NOTE:**
> For content contributed over [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html), a `rtmp-verifiable-segment-info` is instead carried in a `VideoPacketType.Metadata` or `AudioPacketType.Metadata` message and its payload is an `rtmp-segment-info-map`, as described in [Section 15.5.3, “Carriage over Enhanced RTMP (E-RTMP)”](#rtmp_verifiable_segment_info). Session keys are delivered in `c2pa.session-keys` in a `c2paManifest` metadata message.

<a id="_live_media_validation_process"></a>
