---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s301-15-4-1-description
section_title: "15.4.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4131-4140
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 15.4.1. Description

A live media stream may use per-segment C2PA Manifest Boxes to provide per-segment validation. When using this approach, each media segment shall contain a C2PA Manifest Box carried in a `uuid` box as defined in [Section A.5.1, “The `'uuid'` Box for C2PA”](#uuid_box). The active C2PA Manifest for each segment shall contain a BMFF hash assertion (`c2pa.hash.bmff.v3`) with a `hash` field that covers the bytes of that segment and with no `merkle` field, a [Section 15.4.2, “Live Media Segment Assertion”](#livevideo_segment), and may also contain any other assertions relevant to that segment.

Claim generators may derive additional per-segment validation values (e.g., anchor-point-based chaining values) from segment hashes and embed them in the Manifest.

> **NOTE:**
> This method does not require session keys, `verifiable-segment-info-map`, or `emsg` boxes, and can be used independently of the [Section 15.5, “Verifiable Segment Info method”](#verifiable_segment_info).

<a id="livevideo_segment"></a>
