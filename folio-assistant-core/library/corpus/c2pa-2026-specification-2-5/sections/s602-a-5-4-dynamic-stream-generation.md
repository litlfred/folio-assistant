---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s602-a-5-4-dynamic-stream-generation
section_title: "A.5.4. Dynamic stream generation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11752-11756
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.5.4. Dynamic stream generation

Many adaptive bitrate streaming (ABR) implementations store a single version of an asset, e.g., as a flat MP4 or in another intermediate format, and generate individual asset streams using various codecs, bitrates, etc. at consumption time. As a result, such a server shall either hash said streams and create a C2PA Manifest each time the content is consumed or, if generation is deterministic, create and cache the hashes and C2PA Manifests once and then embed them at consumption time.

<a id="_exclusion_list_requirements"></a>
