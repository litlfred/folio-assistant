---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s302-15-4-2-live-media-segment-assertion
section_title: "15.4.2. Live Media Segment Assertion"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4141-4156
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 15.4.2. Live Media Segment Assertion

When using the per-segment C2PA Manifest Box method, a live media segment assertion shall be included in the C2PA Manifest of each segment. This assertion, which provides metadata about the segment and its relationship to the live media stream, shall have a label of `c2pa.livevideo.segment`.

The live media segment assertion shall contain a `sequenceNumber` field that provides a unique identifier for the segment. It shall also contain a `streamId` field that provides a unique identifier for the entire live media stream.

> **NOTE:**
> The value of `streamId` can be any string that uniquely identifies the live media stream, such as a UUID or a URL.

While each segment is validated independently, it is important to maintain the continuity of the live media stream. To facilitate this, the live media segment assertion shall contain a `continuityMethod` field that indicates the method used to ensure continuity between segments, through the use of cryptographic links between adjacent segments.

This specification only defines a single value at this time - `c2pa.manifestId` - which indicates that the continuity is ensured by matching the `previousManifestId` field (to the previous segment’s C2PA Manifest). Implementers may define additional continuity methods and shall use a label as described in [Section 8.2, “Labels”](#assertion_labels) to identify them.

When using the `c2pa.manifestId` continuity method, the live media segment assertion shall contain a `previousManifestId` field that provides the manifest identifier of the previous segment’s C2PA Manifest (described in the `livevideo-segment-map-manifestId` rule). Other continuity methods may add additional fields as needed, provided the fields are also named as described in [Section 8.2, “Labels”](#assertion_labels).

<a id="_schema_and_example"></a>
