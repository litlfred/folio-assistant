---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s334-16-3-1-3-special-consideration-for-jpeg-1
section_title: "16.3.1.3. Special consideration for JPEG 1"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4711-4718
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.1.3. Special consideration for JPEG 1

When hashing a JPEG 1 (.jpg) file into which the C2PA Manifest will be embedded, the APP11 marker (`FFEB`) and the segment’s length (`Lp`) of all APP11 segments containing the JUMBF data shall be included in the exclusion range.

> **NOTE:**
> All the APP11 segments containing the C2PA Manifest JUMBF are contiguous so that only a single range is required.

<a id="_special_consideration_for_png"></a>
