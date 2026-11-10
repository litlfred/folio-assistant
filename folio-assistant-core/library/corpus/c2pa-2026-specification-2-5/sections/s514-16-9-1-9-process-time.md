---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s514-16-9-1-9-process-time
section_title: "16.9.1.9. Process time"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10207-10216
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.9.1.9. Process time

The optional `processStart` and `processEnd` fields describe the overall process represented by the enclosing assertion. As defined in [Section 8.9, “Specifications of time in assertions”](#_specifications_of_time_in_assertions), `processStart` shall use `generator-lower-bound-time-type`, and `processEnd` shall use `generator-upper-bound-time-type`.

When both fields are present, the time value represented by `processStart` shall be less than or equal to the time value represented by `processEnd`.

> **NOTE:**
> The `processStart` and `processEnd` fields are claim generator provided timestamps and are not trusted timestamps.

<a id="_localization"></a>
