---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s675-b-3-2-2-confusable-characters
section_title: "B.3.2.2. Confusable characters"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12665-12669
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### B.3.2.2. Confusable characters

Confusable characters from different scripts can impersonate legitimate identifiers. For example, Cyrillic "а" (U+0430) is visually indistinguishable from Latin "a" (U+0061) in most fonts. Manifest consumers that display identity-bearing fields (claim generator name, `dc:title`, signer identity) should apply confusable detection as defined in [Unicode Technical Standard #39](https://www.unicode.org/reports/tr39/) before presenting these values to users.

<a id="_normalization_2"></a>
