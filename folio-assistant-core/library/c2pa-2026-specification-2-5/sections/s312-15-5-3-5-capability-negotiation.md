---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s312-15-5-3-5-capability-negotiation
section_title: "15.5.3.5. Capability negotiation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4395-4404
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 15.5.3.5. Capability negotiation

Because E-RTMP is also used by endpoints that do not support this specification, support for C2PA Manifests shall be negotiated during the connection handshake using the `C2PA` bit (`0x10`) of `CapsExMask`, as defined by [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html). A client that supports C2PA Manifests shall set this bit in the `capsEx` property of the Command Object of its `connect` command, and shall set the `objectEncoding` property of that same Command Object to 3. A server that supports C2PA Manifests shall set this bit in the Info Object it returns in the `_result` command. An endpoint shall not send a `c2paSegmentInfo` or `c2paManifest` \[name, value\] pair unless both endpoints have signaled support in this way, and an endpoint that has not signaled support should not expect to receive either.

An endpoint receiving a `VideoPacketType.Metadata` or `AudioPacketType.Metadata` message shall ignore any \[name, value\] pair whose name it does not recognize, and shall continue to process the remaining pairs in that message.

> **NOTE:**
> Capability negotiation ensures that a publisher does not depend on how a legacy E-RTMP endpoint handles unrecognized `Metadata` \[name, value\] pairs.

<a id="_reconnection"></a>
