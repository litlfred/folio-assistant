---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s590-a-5-1-the-uuid-box-for-c2pa
section_title: "A.5.1. The `'uuid'` Box for C2PA"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11504-11520
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.5.1. The `'uuid'` Box for C2PA

All BMFF-based C2PA assets, whether they are timed (e.g., videos with or without audio tracks), untimed (e.g., still photos) or mixed (e.g., live or animated photos) audiovisual media, shall use a `'uuid'` box that adheres to the following syntax and semantics defined below.

> **NOTE:**
> The reason that a `'uuid'` box instead of a `'c2pa'` box is being used is that browsers based on Chromium will immediately fail playback when they encounter any unknown top-level boxes.

Some file formats that are BMFF-based and would be supported via this method include:

*   MPEG-4 code-points, either complete (`.mp4`) or fragmented (`.m4s`); downloadable audio files (`.m4a`), including those containing AAC or ALAC data;
    
*   HEIF (`.heif`, `.heic`);
    
*   AVIF (`.avif`).
    

<a id="_definition"></a>
