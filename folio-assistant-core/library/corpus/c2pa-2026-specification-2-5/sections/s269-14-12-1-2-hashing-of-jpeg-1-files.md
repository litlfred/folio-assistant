---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s269-14-12-1-2-hashing-of-jpeg-1-files
section_title: "14.12.1.2. Hashing of JPEG 1 files"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3775-3782
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.12.1.2. Hashing of JPEG 1 files

In JPEG 1 files, the file format extras described above would include any `APP11` markers and their respective segment length bytes for `APP11` segments. Because the segment lengths are inside the exclusion range, a validator shall match the total length of the exclusion range with that of the total length of all `APP11` segments representing the C2PA Manifest to ensure that the length was not tampered with.

> **NOTE:**
> A JPEG 1 file can contain `APP11` segments for reasons other than C2PA (e.g., JPEG 360 or JPEG Privacy and Security) and those are not included in these calculations.

<a id="_hashing_of_unstructured_text"></a>
