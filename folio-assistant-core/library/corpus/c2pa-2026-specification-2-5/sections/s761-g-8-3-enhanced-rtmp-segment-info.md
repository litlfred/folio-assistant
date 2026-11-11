---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s761-g-8-3-enhanced-rtmp-segment-info
section_title: "G.8.3. Enhanced RTMP Segment Info"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 16039-16064
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.8.3. Enhanced RTMP Segment Info

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

<a id="cddl_annex_rtmp_hash"></a>
