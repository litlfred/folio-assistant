---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s297-15-3-1-c2pa-manifest-transport
section_title: "15.3.1. C2PA Manifest transport"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4094-4105
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 15.3.1. C2PA Manifest transport

The live media architecture builds upon this specification’s support for BMFF-based asset embedding, adding mechanisms to support real-time content validation. The two key parts of that are (1) any hashing of content shall be done using a standard `bmff-hash-map` (where the target of the hash is a segment) or, for content contributed over [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html), as described in [Section 15.5.3, “Carriage over Enhanced RTMP (E-RTMP)”](#rtmp_verifiable_segment_info), and (2) anytime that a C2PA Manifest Store is included in a live media stream, it shall be incorporated into a `uuid` box as described in [Section A.5.1, “The `'uuid'` Box for C2PA”](#uuid_box), or for content contributed over [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html), it shall be delivered in a `c2paManifest` \[name, value\] pair in a `VideoPacketType.Metadata` or `AudioPacketType.Metadata` message.

For live media or dynamically packaged content, the `uuid` box containing a C2PA Manifest Store may also be present in any segment. This box will be referred to as the "C2PA Manifest Box" in the context of live media.

Dynamically packaged content is prepared "just-in-time" for streaming. That is, the content segments and manifest describing the content, are prepared once a request is received for the content and not before (which would be the case for statically packaged content). In this specification the terms "live media" and "dynamically packaged content" are used interchangeably.

> **NOTE:**
> Live streams are, by definition, dynamically packaged but not all dynamically packaged content is live.

<a id="_segment_based_validation"></a>
