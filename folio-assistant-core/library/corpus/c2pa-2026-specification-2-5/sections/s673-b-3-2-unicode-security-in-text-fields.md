---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s673-b-3-2-unicode-security-in-text-fields
section_title: "B.3.2. Unicode security in text fields"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12655-12659
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### B.3.2. Unicode security in text fields

C2PA Manifests contain text string fields that are displayed to users or compared programmatically, including `dc:title`, `description`, claim generator identifiers, and action `reason` values. These fields are susceptible to Unicode-based attacks that can mislead users or undermine provenance integrity.

<a id="_bidirectional_overrides"></a>
