---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s624-a-8-2-the-c2patextmanifestwrapper-structure
section_title: "A.8.2. The `C2PATextManifestWrapper` Structure"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12009-12016
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.8.2. The `C2PATextManifestWrapper` Structure

All unstructured text assets that wish to embed a Content Credential shall do so using Unicode variation selectors that adhere to the following syntax and semantics defined below.

> **NOTE:**
> Unicode variation selectors (U+FE00-U+FE0F and U+E0100-U+E01EF) are used because they are specifically designed to be visually non-rendering while remaining part of the valid Unicode character set.

<a id="_definition_2"></a>
