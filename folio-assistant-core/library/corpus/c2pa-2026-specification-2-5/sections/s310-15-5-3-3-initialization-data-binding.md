---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s310-15-5-3-3-initialization-data-binding
section_title: "15.5.3.3. Initialization data binding"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4328-4342
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 15.5.3.3. Initialization data binding

A C2PA Manifest delivered in a `c2paManifest` \[name, value\] pair shall contain, as its hard binding, a [data hash assertion](#_data_hash) without an `exclusions` field, whose hash is computed over the E-RTMP initialization data. The E-RTMP initialization data is the concatenation of the codec configuration payloads (for example, `[AVCDecoderConfigurationRecord]`, `[HEVCDecoderConfigurationRecord]` or `[AacSequenceHeader]`, as defined by [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html)) carried in the most recent `SequenceStart` packet (or, for legacy codec signaling, the equivalent sequence header) of each track, ordered with video tracks before audio tracks and, within each media type, by ascending `trackId` (see [Section 15.5.3.1, “Logical segment”](#ertmp_segment)). When validating that hard binding, the E-RTMP initialization data shall be treated as the content of the asset.

A publisher shall send the codec configuration of each track before the `c2paManifest` that binds to it. If codec configuration for any track is sent after a `c2paManifest` (for example, because of a change of codec configuration), the publisher shall send a new `c2paManifest`, bound to the updated E-RTMP initialization data, before the first coded frame that depends on that configuration.

A publisher shall send the codec configuration of each track on the same chunk stream as the coded frames of that track. A validator shall validate the hard binding of a C2PA Manifest delivered in a `c2paManifest` \[name, value\] pair when it validates the first segment, of any track, whose `manifestId` identifies that C2PA Manifest, rather than when the `c2paManifest` is received. That hard binding shall be validated against the E-RTMP initialization data formed from the codec configuration of each track most recently received before the `c2paSegmentInfo` that closes that segment.

> **NOTE:**
> This mirrors the BMFF case, in which the C2PA Manifest in the initialization segment binds to the `moov` box that carries the codec configuration. `onMetaData` is not included because intermediaries commonly rewrite it. Consequently, track properties conveyed only in `onMetaData`, such as the language of an audio track, are not bound by the C2PA Manifest, unlike the corresponding properties in the `moov` box.

> **NOTE:**
> When several message streams are published on the same connection, this clause does not provide for a separate C2PA Manifest for each of them; the E-RTMP initialization data of a C2PA Manifest comprises the tracks of all of them. Because tracks are identified only by their media type and `trackId`, this works only if no two of these tracks have the same media type and `trackId`, for example if audio tracks in different languages are published as [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html) multitrack tracks of one message stream rather than on separate message streams.

<a id="_amf_carriage"></a>
