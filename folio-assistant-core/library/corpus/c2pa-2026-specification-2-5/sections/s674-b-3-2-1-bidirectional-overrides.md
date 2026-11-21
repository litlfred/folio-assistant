---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s674-b-3-2-1-bidirectional-overrides
section_title: "B.3.2.1. Bidirectional overrides"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12660-12664
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### B.3.2.1. Bidirectional overrides

Bidirectional override characters (U+202A through U+202E) can reorder displayed text to misrepresent field content, as demonstrated by the Trojan Source attack ([CVE-2021-42574](https://nvd.nist.gov/vuln/detail/CVE-2021-42574)). Claim generators shall not include bidirectional override characters in text fields. Bidirectional isolate characters (U+2066 through U+2069) are permitted in fields containing mixed-direction text.

<a id="_confusable_characters"></a>
