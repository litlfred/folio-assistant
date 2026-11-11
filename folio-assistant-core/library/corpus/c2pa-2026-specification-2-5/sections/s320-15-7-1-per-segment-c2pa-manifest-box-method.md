---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s320-15-7-1-per-segment-c2pa-manifest-box-method
section_title: "15.7.1. Per-segment C2PA Manifest Box method"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4458-4462
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 15.7.1. Per-segment C2PA Manifest Box method

When using the per-segment C2PA Manifest Box method, the C2PA Manifest of each segment is constructed in the same way that is described in [Section A.5, “Embedding manifests into BMFF-based assets”](#_embedding_manifests_into_bmff_based_assets), but with the `bmff-hash-map` only hashing the bytes of that segment. In addition, a [Section 15.4.2, “Live Media Segment Assertion”](#livevideo_segment) shall be included in the manifest to provide metadata about the segment.

<a id="_verifiable_segment_info_method"></a>
