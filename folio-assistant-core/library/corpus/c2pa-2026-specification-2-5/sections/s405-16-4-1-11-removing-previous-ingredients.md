---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s405-16-4-1-11-removing-previous-ingredients
section_title: "16.4.1.11. Removing Previous Ingredients"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 7112-7116
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.4.1.11. Removing Previous Ingredients

When a deletion includes all of the content of a given ingredient, a claim generator may use a `c2pa.deleted` action to indicate that the previously composed asset ingredient (recorded in a previous manifest as an ingredient assertion with a `componentOf` relationship) has been removed from the content, and should not be considered part of the current asset. A claim generator or user may also wish to redact that ingredient assertion, in which case a `c2pa.redacted` action should be used as well, and the `c2pa.deleted` action should reference the ingredient assertion that has been redacted.

<a id="actions_ingredients_relationship"></a>
