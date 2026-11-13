---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s366-16-3-5-1-description
section_title: "16.3.5.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 5930-5947
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.5.1. Description

There exist a number of file formats that are composed of multiple parts, where each part is itself a valid file format, such as when multiple individual images are aggregated into a single file. Some examples include:

*   [CIPA Multi-Picture Format (MPF)](https://www.cipa.jp/std/documents/download_e.html?CIPA_DC-007-2025_E)
    
*   Android [Ultra HDR](https://developer.android.com/media/platform/hdr-image-format) format (which uses MPF)
    
*   [ISO 21496](https://www.iso.org/standard/86775.html) HDR (which uses MPF)
    
*   [Android Motion Photo](https://developer.android.com/media/platform/motion-photo-format) format (which doesn’t use MPF, but can exist alongside MPF in the same file)
    

In some cases, it may be desirable or even required to verify the integrity of each individual part of the file, rather than just the file as a whole. Accordingly, the current set of hard binding assertions are not sufficient to separately verify the integrity of each part. Additionally, the individual parts may have their own C2PA Manifests that need to be recorded. The multi-asset hash assertion is used to provide this functionality.

One additional unique case is where an individual part is optional - meaning that it is possible that it can/will be removed as part of a workflow that does not involve a trusted signer - but the ability to verify the integrity of the rest of the file is still desired.

<a id="_details"></a>
