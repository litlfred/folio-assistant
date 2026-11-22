---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s640-a-8-6-2-normalization
section_title: "A.8.6.2. Normalization"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12234-12238
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.8.6.2. Normalization

Both producers and consumers shall normalize text to Unicode Normalization Form C (NFC) before calculating hashes (see [UAX #15](https://www.unicode.org/reports/tr15/)). This ensures consistent hash values across different platforms that may store text in different normalization forms.

<a id="_exclusion_handling"></a>
