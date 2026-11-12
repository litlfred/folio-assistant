---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s294-15-1-introduction
section_title: "15.1. Introduction"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4067-4082
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 15.1. Introduction

The C2PA Live Media specification is designed to support the unique requirements of live media workflows, streaming workflows and dynamic packaging, where content is created and distributed in real-time, or packaged in a just-in-time manner. This specification outlines how to manage assertions related to tracks (video, audio, subtitles, etc) in live sessions, ensuring the integrity and authenticity of the content as it is produced and shared.

> **NOTE:**
> Live Media workflows can include both live streaming scenarios (e.g., live sports events, news broadcasts) and dynamic packaging scenarios (e.g., on-the-fly packaging of content for adaptive streaming).

> **NOTE:**
> Live Media isn’t constrained to only live video streaming, it can also be used for other types of live media streaming (e.g., live audio streaming), so long as the packaging is BMFF or the content is delivered via [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html).

This version of the specification applies to content packaged using the [ISO/IEC 14496-12, ISO BMFF](https://www.iso.org/standard/83102.html) standard, while being agnostic of manifest and delivery protocols. It also applies to [ISO/IEC 23000-19](https://www.iso.org/standard/85623.html) content, which is a constrained subset of ISO BMFF optimized for adaptive streaming. It also applies to content contributed over [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html), a message-based streaming protocol that does not package content using ISO BMFF, via the [Section 15.5, “Verifiable Segment Info method”](#verifiable_segment_info).

> **NOTE:**
> It does not support [MPEG-2 — Part 1: Systems](https://www.iso.org/standard/91403.html) (MPEG-2 Transport Streams).

<a id="_compatibility_with_previous_versions"></a>
