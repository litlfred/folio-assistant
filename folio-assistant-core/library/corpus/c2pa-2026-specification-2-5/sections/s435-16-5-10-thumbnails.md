---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s435-16-5-10-thumbnails
section_title: "16.5.10. Thumbnails"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8480-8486
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 16.5.10. Thumbnails

When adding an ingredient, it may be useful to also include a thumbnail of the ingredient to help establish the state of the ingredient at the time of import. For that purpose, a thumbnail shall be added as a [thumbnail assertion](#thumbnail_assertion) and referenced herein via a hashed-uri reference. If a new thumbnail assertion is created in the active manifest, it shall also be added to the [`relatedAssertions`](#ingredient_related_assertions) field.

Manifest Consumers should also support the [data box](#_data_boxes) approach recommended by earlier versions of this specification.

<a id="ingredient_related_assertions"></a>
