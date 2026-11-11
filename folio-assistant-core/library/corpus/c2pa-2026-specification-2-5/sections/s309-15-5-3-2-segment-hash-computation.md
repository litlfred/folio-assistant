---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s309-15-5-3-2-segment-hash-computation
section_title: "15.5.3.2. Segment hash computation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4305-4327
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 15.5.3.2. Segment hash computation

The `segmentHash` field of an `rtmp-segment-info-map` shall be computed, using the algorithm identified in its `alg` field, over the concatenation, in transmission order, of the following fields of each coded-frame packet of the segment:

1.  the RTMP message timestamp of the message carrying the packet, as a 32-bit unsigned big-endian integer;
    
2.  the composition time offset of the packet, as a 24-bit signed big-endian integer, or 0 if the packet carries none (for example, a `CodedFramesX` packet or an audio packet);
    
3.  the coded media data of the packet (for example, `[AvcCodedData]`, `[HevcCodedData]` or `[AacCodedData]`, as defined by [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html)).
    

From a Multitrack message, only the packet of the segment’s track shall be included, using the RTMP message timestamp of the Multitrack message. The audio and video messages contained in an RTMP Aggregate Message (message type 22) shall be treated as if they had been transmitted individually, with their normalized timestamps as defined by [Adobe’s Real Time Messaging Protocol](https://veovera.org/docs/legacy/rtmp-v1-0-spec.pdf). No other bytes shall be included in the hash.

> **NOTE:**
> Consequently, RTMP protocol control messages, RTMP Data Messages (such as `onMetaData`), codec configuration (`SequenceStart`) packets (which are instead bound as described in [Section 15.5.3.3, “Initialization data binding”](#ertmp_init_binding)), and all `Metadata` messages, including those carrying `colorInfo`, `c2paSegmentInfo` or `c2paManifest`, do not contribute to `segmentHash`.

> **NOTE:**
> As with the `moof` box covered by `bmffHash`, an intermediary that rewrites RTMP message timestamps or composition time offsets invalidates `segmentHash`. The frame type is not included, as it is conveyed by the coded media data.

> **NOTE:**
> The nanosecond timestamp offset that [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html) carries as `TimestampOffsetNano` ModEx data is not included in `segmentHash`. An intermediary can therefore change or remove it without invalidating `segmentHash`, and a validator cannot rely on it being the value sent by the publisher.

<a id="ertmp_init_binding"></a>
