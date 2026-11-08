---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s468-16-6-5-1-description
section_title: "16.6.5.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9290-9298
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.6.5.1. Description

A depthmap assertion provides a 3D description of the scene being captured by a camera. A depthmap assertion may contain a pre-computed [depth map](https://en.wikipedia.org/wiki/Depth_map), or data which can later be used to compute a depth map by downstream ingestion or viewing software (e.g., left/right stereo images).

All depthmap assertions shall have a label that starts with `c2pa.depthmap` and be followed by a third section that identifies the type of depth map.

C2PA depthmap assertions shall be captured optically, not inferred from a single 2D image via, for example, a machine learning model.

<a id="_gdepth_depthmap"></a>
