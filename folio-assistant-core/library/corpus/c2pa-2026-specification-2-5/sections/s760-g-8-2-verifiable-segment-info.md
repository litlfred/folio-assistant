---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s760-g-8-2-verifiable-segment-info
section_title: "G.8.2. Verifiable Segment Info"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 16018-16038
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.8.2. Verifiable Segment Info

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

<a id="cddl_annex_rtmp_segment_info"></a>
