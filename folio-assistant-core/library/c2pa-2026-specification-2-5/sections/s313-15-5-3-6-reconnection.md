---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s313-15-5-3-6-reconnection
section_title: "15.5.3.6. Reconnection"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4405-4415
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 15.5.3.6. Reconnection

The C2PA state of a stream (the active C2PA Manifest, its session keys and the `sequenceNumber` of each track) is not affected by an [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html) reconnection (for example, in response to a `NetConnection.Connect.ReconnectRequest`): segments sent on the new connection shall continue the `sequenceNumber` of each track. After reconnecting, a publisher shall send the active C2PA Manifest again in a `c2paManifest` \[name, value\] pair, after the codec configuration of each track and before the first coded frame.

> **NOTE:**
> A reconnection can move the publisher to a different server instance, which has not received the C2PA Manifest sent on the previous connection. Sending it again allows segments sent on the new connection to be validated without depending on state from the previous connection.

> **NOTE:**
> Because a segment is scoped to the message stream on which it is carried (see [Section 15.5.3.1, “Logical segment”](#ertmp_segment)), a segment cannot span a reconnection: the first segment of each track on the new connection begins with the first frame of that track sent on that connection, and frames of a segment whose `c2paSegmentInfo` was not sent before the previous connection was lost cannot be validated. In response to a `NetConnection.Connect.ReconnectRequest`, a publisher can avoid this by sending the `c2paSegmentInfo` of the current segment of each track before disconnecting.

<a id="_c2pa_manifest_updates"></a>
