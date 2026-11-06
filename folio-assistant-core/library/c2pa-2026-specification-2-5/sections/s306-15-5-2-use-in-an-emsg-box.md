---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s306-15-5-2-use-in-an-emsg-box
section_title: "15.5.2. Use in an `emsg` box"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4236-4280
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 15.5.2. Use in an `emsg` box

When using the `verifiable-segment-info` in a live media workflow, a `verifiable-segment-info` shall be present in the `emsg` box of each segment of a live media stream to verify the integrity of the content during playback.

> **NOTE:**
> This requirement applies only to workflows that chose the `verifiable-segment-info` method and does not apply to workflows that rely solely on C2PA Manifest Boxes embedded in each segment.

The C2PA `emsg` box fields shall have:

*   `version` set to `0`
    
*   `scheme_id_uri` set to `urn:c2pa:verifiable-segment-info`
    
*   `value` set to `"fseg"`
    
*   `presentation_time_delta` set to 0
    
*   `timescale` and `event_duration` set to cover the whole segment
    
*   `id` set to a session-unique value
    
*   `message_data` set to the encoded `verifiable-segment-info`
    

The schema for `verifiable-segment-info` is defined in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.8.2, “Verifiable Segment Info”](#cddl_annex_verifiable_segment_info) for the complete normative schema):

```cddl
verifiable-segment-info = COSE_Sign1_Tagged
; The protected header contains the signature algorithm ('alg')
; and optionally the "claimed time of signing" ('iat').
; The unprotected header contains the the identifier of the session key ('kid').
; The payload is set to the CBOR serialized `segment-info-map`.

segment-info-map = {
    ; monotonically increasing sequence number for each segment
    "sequenceNumber" => uint,
    "bmffHash" => bmff-hash-map, ; C2PA c2pa.hash.bmff.v3
    "manifestId" => tstr, ; shall be as described in <<manifest-identifier>>

    ; optional hashed-ext-uri-map to where manifest can be retrieved
    ? "manifestUri" => $hashed-ext-uri-map
}
```

<a id="rtmp_verifiable_segment_info"></a>
