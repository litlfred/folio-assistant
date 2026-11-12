---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s303-15-4-2-1-schema-and-example
section_title: "15.4.2.1. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4157-4195
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 15.4.2.1. Schema and Example

The schema for this type is defined by the `livevideo-segment-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.8.1, “Live Media Segment”](#cddl_annex_livevideo_segment) for the complete normative schema):

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

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) is shown below:

```none
{
  "sequenceNumber": 175,
  "streamId": "123e4567-e89b-12d3-a456-426614174000",
  "continuityMethod": "c2pa.manifestId",
  "previousManifestId": "urn:c2pa:F9168C5E-CEB2-4FAA-B6BF-329BF39FA1E4"
}
```

<a id="verifiable_segment_info"></a>
