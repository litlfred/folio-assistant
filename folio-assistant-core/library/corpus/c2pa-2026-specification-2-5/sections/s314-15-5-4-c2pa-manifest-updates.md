---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s314-15-5-4-c2pa-manifest-updates
section_title: "15.5.4. C2PA Manifest Updates"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4416-4423
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 15.5.4. C2PA Manifest Updates

When different assertions are required for a new segment (for example, to indicate different provenance or replace expiring session keys), a new C2PA Manifest Store shall be provided, either embedded in the segment via a C2PA Manifest Box or linked externally, or for E-RTMP-delivered segments, via a `c2paManifest` \[name, value\] pair in a `VideoPacketType.Metadata` or `AudioPacketType.Metadata` message. The new manifest shall be used for all subsequent segments until another manifest is provided.

> **NOTE:**
> This allows for dynamic updates to the C2PA Manifest information while maintaining the integrity and authenticity of the content.

<a id="session_keys"></a>
