---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s200-14-5-2-2-special-considerations-for-pdf
section_title: "14.5.2.2. Special Considerations for PDF"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2655-2661
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.5.2.2. Special Considerations for PDF

PDF files support a technology called "incremental update", where information is appended to the end of the document instead of modifying the original. This requires that PDF files support multiple C2PA Manifest Stores - though there shall only be one per update section.

If there are multiple C2PA Manifest Stores present in a single update section, they shall all be considered as invalid and the validation should treat this as if no manifests were located. However, any C2PA Manifest Stores present in early updates of the PDF or of the original PDF, shall still be considered valid and processed accordingly.

<a id="_special_considerations_for_html"></a>
