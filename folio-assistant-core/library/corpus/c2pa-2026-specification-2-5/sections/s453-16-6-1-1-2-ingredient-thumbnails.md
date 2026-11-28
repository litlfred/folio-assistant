---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s453-16-6-1-1-2-ingredient-thumbnails
section_title: "16.6.1.1.2. Ingredient Thumbnails"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8814-8824
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.6.1.1.2. Ingredient Thumbnails

When importing an ingredient (see [Section 10.3.2.2, “Adding Ingredients”](#_adding_ingredients)), one should reference that ingredient’s own manifest-stored thumbnail. However, some ingredients may not include a thumbnail assertion, or even a manifest. In that case, a new thumbnail of the ingredient should be generated, and an ingredient thumbnail assertion created in the active manifest.

An ingredient thumbnail assertion shall have a label that starts with `c2pa.thumbnail.ingredient` and follows the [rules of assertion labels](#_multiple_instances) with respect to multiple instances. For example, an ingredient thumbnail might have the label `c2pa.thumbnail.ingredient__1`. This assertion shall also be added to the [ingredient’s `relatedAssertions`](#ingredient_related_assertions) field.

Previous versions of this specification required that the IANA registry media type of the thumbnail be included in the label name (e.g., `c2pa.thumbnail.claim.png`). This naming convention has been deprecated.

Previous versions of this specification required a `_1` suffix for the first instance, and required a single underscore. The current specification, by adopting consistent naming with all assertions, uses `c2pa.thumbnail.ingredient` for the first instance, `c2pa.thumbnail.ingredient__1` for the second, etc. The previous naming convention has been deprecated.

<a id="_technical_details"></a>
