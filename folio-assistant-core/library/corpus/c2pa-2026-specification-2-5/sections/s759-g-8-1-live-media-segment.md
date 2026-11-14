---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s759-g-8-1-live-media-segment
section_title: "G.8.1. Live Media Segment"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 15992-16017
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.8.1. Live Media Segment

```cddl
; assertion used to carry live media segment information
; this assertion shares `sequenceNumber` semantics with
; `verifiable-segment-info-map`

livevideo-segment-map = {
    ; monotonically increasing sequence number for each segment
    "sequenceNumber" => uint,
    "streamId" => tstr, ; A unique "streamId" identifying the live media stream

    ; method used to ensure continuity between segments
    "continuityMethod" => tstr,
    * tstr => any ; additional fields as needed
}


; when continuityMethod == c2pa.manifestId, additional fields include:
livevideo-segment-map-manifestId = {
    ; <<manifest-identifier>> of the previous segment's C2PA Manifest
    "previousManifestId" => tstr,
}
```

<a id="cddl_annex_verifiable_segment_info"></a>
