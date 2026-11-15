---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s316-15-5-5-1-description
section_title: "15.5.5.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4427-4440
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 15.5.5.1. Description

Session keys are asymmetric key pairs. Any of the cryptographic algorithms allowed for [claim generator X.509 certificates](#certificate-requirements) may be used.

When using session-specific keys, they shall be generated at the start of a live media session, but may also be generated and delivered via updated manifests in later segments (either initialization or other segments). Each session key is used for a limited period, which enables key rotation. Session-specific keys should be updated when the provenance changes.

The public halves of the session keys are delivered inside a C2PA Manifest. The initial set of keys shall be part of the C2PA Manifest included in the initialization segment, or for E-RTMP-delivered segments, via a `c2paManifest` \[name, value\] pair in a `VideoPacketType.Metadata` or `AudioPacketType.Metadata` message sent before the `c2paSegmentInfo` that references them.

Session keys may also be retrieved from additional initialization segments, from the active C2PA Manifest included in a [C2PA Manifest Box](#c2pa_manifest_box), from a `c2paManifest` \[name, value\] pair (for E-RTMP-delivered segments), or from the `manifestUri` included in a `verifiable-segment-info`. If a receiver finds a `verifiable-segment-info` signed with a session key not yet known to the receiver, the receiver should extract updated session keys from the manifest carried in the [C2PA Manifest Box](#c2pa_manifest_box), if present. If no [C2PA Manifest Box](#c2pa_manifest_box) is present in the segment, then the receiver should attempt to retrieve a C2PA Manifest Store from the URL specified in the `manifestUri` field of the `verifiable-segment-info`, if present (see [Section 11.8, “External Manifests”](#_external_manifests)). If no C2PA Manifest is present in the current segment, the receiver shall look in the C2PA Manifest that accompanied the initialization segment. For E-RTMP-delivered segments, which have neither a C2PA Manifest Box nor an initialization segment, the receiver shall instead look in the C2PA Manifest delivered in a `c2paManifest` \[name, value\] pair whose manifest identifier matches the `manifestId` field of the `rtmp-segment-info-map` and, if no such C2PA Manifest has been received or the session key is not found there, should attempt to retrieve a C2PA Manifest Store from the `manifestUri` field of the `rtmp-segment-info-map`, if present. After retrieving the C2PA Manifest, the receiver shall ensure that its manifest identifier matches the one provided in the `manifestId` field of the `verifiable-segment-info`.

> **IMPORTANT:**
> When using an externally hosted C2PA Manifest that is provided via a `manifestUri` in a `verifiable-segment-info`, that C2PA Manifest needs to exist at that URI for the entire period of time that the content is provided.

<a id="_session_keys_assertion"></a>
