---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s469-16-6-5-2-gdepth-depthmap
section_title: "16.6.5.2. GDepth Depthmap"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9299-9310
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.6.5.2. GDepth Depthmap

A GDepth depth map assertion leverages the well-established [GDepth format](https://developers.google.com/depthmap-metadata/reference) to encode a pre-computed depth map.

A GDepth depthmap assertion shall have a label of `c2pa.depthmap.GDepth`.

The schema for the data stored in this assertion shall always mirror the schema at [https://developers.google.com/depthmap-metadata/reference](https://developers.google.com/depthmap-metadata/reference).

> **NOTE:**
> There are no concerns with splitting up the GDepth data when it grows beyond 64KB, as that limit existed in XMP to accommodate `APP1` segment size limitations.

<a id="_schema_and_example_16"></a>
