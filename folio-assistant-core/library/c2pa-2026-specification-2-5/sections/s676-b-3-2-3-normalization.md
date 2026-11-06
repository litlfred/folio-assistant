---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s676-b-3-2-3-normalization
section_title: "B.3.2.3. Normalization"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12670-12674
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### B.3.2.3. Normalization

Text fields that are not in a consistent Unicode normalization form can produce different hash values for semantically identical content, affecting search, comparison, and deduplication. Claim generators should produce text string fields in Unicode Normalization Form C (NFC), consistent with [Character Model for the World Wide Web: String Matching](https://www.w3.org/TR/charmod-norm/).

<a id="_adversarial_control_characters"></a>
