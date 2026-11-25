---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s308-15-5-3-1-logical-segment
section_title: "15.5.3.1. Logical segment"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4289-4304
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 15.5.3.1. Logical segment

Content contributed over [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html) may include multiple tracks of the same media type (for example, multiple audio tracks), identified by `trackId` when [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html) multitrack support is used. For the purposes of this clause, a track is identified by its media type together with its `trackId`; audio and video `trackId` values are independent of each other, and an audio or video message that does not use [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html) multitrack belongs to track 0 of its media type. A segment is scoped to a single track of the RTMP message stream (as defined by [Adobe’s Real Time Messaging Protocol](https://veovera.org/docs/legacy/rtmp-v1-0-spec.pdf)) on which its `rtmp-verifiable-segment-info` is carried, identified by the `mediaType` and `trackId` fields of the `rtmp-segment-info-map`; an absent `trackId` is equivalent to 0. The `Metadata` message carrying a `rtmp-verifiable-segment-info` shall belong to the track it identifies.

A video segment shall begin at the `VideoTagHeader` of the first video frame following the previous video segment of that track (or, for a track’s first segment, at the start of that track) and shall consist of one or more complete video frames, followed by one or more E-RTMP `VideoPacketType.Metadata` messages, each carrying a `rtmp-verifiable-segment-info` whose payload is an `rtmp-segment-info-map` describing those frames.

An audio segment shall begin at the `AudioTagHeader` of the first audio frame following the previous audio segment of that track (or, for a track’s first segment, at the start of that track) and shall consist of one or more complete audio frames, followed by one or more E-RTMP `AudioPacketType.Metadata` messages, each carrying a `rtmp-verifiable-segment-info` whose payload is an `rtmp-segment-info-map` describing those frames.

A publisher shall send each `VideoPacketType.Metadata` message on the same chunk stream (that is, with the same Chunk Stream ID, as defined by [Adobe’s Real Time Messaging Protocol](https://veovera.org/docs/legacy/rtmp-v1-0-spec.pdf)) as the video messages carrying the coded frames of the track it describes. Likewise, a publisher shall send each `AudioPacketType.Metadata` message on the same RTMP chunk stream as the audio messages carrying the coded frames of the track it describes. The RTMP message timestamp of a `Metadata` message carrying a `rtmp-verifiable-segment-info` shall be equal to that of the last frame of the segment it closes.

> **NOTE:**
> Because RTMP messages sent on different chunk streams can be interleaved, carrying a track’s `Metadata` messages on the same chunk stream as that track’s coded frames ensures that a receiver observes them in the order in which they were sent, and therefore that the frames closed by each `c2paSegmentInfo` are unambiguous.

Consecutive `Metadata` messages that carry a `rtmp-verifiable-segment-info` for the same track and are not separated by any frame of that track belong to the segment they close, not to a new, empty segment. A segment boundary shall occur only at the completion of a frame; it shall not split a frame across two segments. As with [the `segment-info-map` used for BMFF content](#verifiable_segment_info), the `sequenceNumber` shall increase monotonically by 1 for each subsequent segment of a given `mediaType` and `trackId`, independently of any other track. A given [session key](#session_keys) shall be used to sign the `rtmp-verifiable-segment-info` of only one track (that is, of one combination of `mediaType` and `trackId`).

<a id="_segment_hash_computation"></a>
