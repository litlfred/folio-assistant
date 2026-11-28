---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s307-15-5-3-carriage-over-enhanced-rtmp-e-rtmp
section_title: "15.5.3. Carriage over Enhanced RTMP (E-RTMP)"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4281-4288
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 15.5.3. Carriage over Enhanced RTMP (E-RTMP)

[Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html) is a message-based, continuously multiplexed streaming protocol commonly used for live contribution ("first mile") streaming, and does not package content using ISO BMFF. For content contributed over [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html), `rtmp-verifiable-segment-info` is carried in an E-RTMP `VideoPacketType.Metadata` message (for the video track) or `AudioPacketType.Metadata` message (for an audio track) instead of an `emsg` box, and its payload is an `rtmp-segment-info-map` instead of a `segment-info-map`. Its `sequenceNumber` and `manifestId` fields have the same meaning as the corresponding fields described above in [Section 15.5, “Verifiable Segment Info method”](#verifiable_segment_info); `segmentHash` replaces `bmffHash` and, instead of a `bmff-hash-map`, contains an `rtmp-hash-map` as described below.

> **NOTE:**
> `AudioPacketType.Metadata` is not yet defined by [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html). Its use here assumes that it has been added to the E-RTMP specification.

<a id="ertmp_segment"></a>
