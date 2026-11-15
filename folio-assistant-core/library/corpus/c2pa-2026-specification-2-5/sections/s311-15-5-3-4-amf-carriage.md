---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s311-15-5-3-4-amf-carriage
section_title: "15.5.3.4. AMF carriage"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4343-4394
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 15.5.3.4. AMF carriage

Within a `VideoPacketType.Metadata` or `AudioPacketType.Metadata` message, AMF3 object encoding shall be used, and the value of each of the following \[name, value\] pairs, when present, shall be carried as a native AMF3 `ByteArray`:

`c2paSegmentInfo`

The binary-encoded `rtmp-verifiable-segment-info`, whose payload is an `rtmp-segment-info-map`, present in the `Metadata` message(s) that close each segment of the track carrying it. More than one `c2paSegmentInfo` may be present consecutively for the same segment (for example, signed with different session keys during key rotation); in that case, the segment shall be considered valid if at least one of them validates. It is signaled by the \[name, value\] pair `["c2paSegmentInfo", ByteArray]`.

`c2paManifest`

A binary-encoded C2PA Manifest Store, which shall include a `c2pa.session-keys` assertion, present for the first manifest, and when the active manifest is updated. It should be carried on the video track, unless a separate manifest is needed for an audio track. It is signaled by the \[name, value\] pair `["c2paManifest", ByteArray]`.

The schema for `rtmp-segment-info-map` is defined in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.8.3, “Enhanced RTMP Segment Info”](#cddl_annex_rtmp_segment_info) for the complete normative schema):

```cddl
rtmp-media-type = "audio" / "video"

; The `verifiable-segment-info` structure when carried over Enhanced RTMP
; (E-RTMP). The payload is the CBOR serialized `rtmp-segment-info-map`.
rtmp-verifiable-segment-info = COSE_Sign1_Tagged

; Payload map for `rtmp-verifiable-segment-info` when carried over Enhanced
; RTMP (E-RTMP), where segments are not packaged as BMFF/CMAF fragments.
rtmp-segment-info-map = {
  "mediaType": rtmp-media-type,
  ? "trackId": uint .le 255, ; E-RTMP trackId of the track; absent is equivalent to 0

  ; sequence number, increasing monotonically by 1 per segment of this mediaType/trackId
  "sequenceNumber": uint,
  "segmentHash": rtmp-hash-map, ; hash of the segment's media payload bytes
  "manifestId": tstr, ; identifier of the active manifest (see <<manifest-identifier>>)

  ; optional hashed-ext-uri-map to where manifest can be retrieved
  ? "manifestUri": $hashed-ext-uri-map
}
```

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) is shown below:

```none
{
  "mediaType": "video",
  "sequenceNumber": 175,
  "segmentHash": {
    "alg": "sha256",
    "hash": h'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  "manifestId": "urn:c2pa:F9168C5E-CEB2-4FAA-B6BF-329BF39FA1E4"
}
```

<a id="_capability_negotiation"></a>
