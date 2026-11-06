---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s677-b-3-2-4-adversarial-control-characters
section_title: "B.3.2.4. Adversarial control characters"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12675-12679
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### B.3.2.4. Adversarial control characters

The following character categories have no legitimate use in C2PA text fields: tag characters (U+E0001 through U+E007F), C1 control characters (U+0080 through U+009F), interlinear annotation characters (U+FFF9 through U+FFFB), and sequences of variation selectors applied to non-varying base characters. Claim generators shall not include these characters in text fields.

<a id="_retrieval_of_externally_referenced_data"></a>
