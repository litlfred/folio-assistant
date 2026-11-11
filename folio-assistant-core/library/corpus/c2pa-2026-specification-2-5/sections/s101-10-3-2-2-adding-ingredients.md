---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s101-10-3-2-2-adding-ingredients
section_title: "10.3.2.2. Adding Ingredients"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1410-1418
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 10.3.2.2. Adding Ingredients

In many authoring scenarios, an actor does not create an entirely new asset but instead brings in other existing assets on which to create their work - either as a derived asset, a composed asset or an asset rendition. These existing assets are called ingredients and their use is documented in the provenance data through the use of an [ingredient assertion](#ingredient_assertion).

When an ingredient contains one or more C2PA manifests, those manifests should be inserted into this asset’s C2PA Manifest Store to help ensure that the provenance data is kept intact. Such ingredient manifests are added to the JUMBF as described in [Section 11.4, “Ingredient Storage”](#_ingredient_storage). If a manifest with the same unique identifier is already present in the C2PA Manifest Store, the two shall be compared. If they are identical, the new manifest shall be ignored. If they are different, the new manifest shall be added to the store after changing its unique identifier to a new value as described in [Chapter 9, _Unique Identifiers_](#_unique_identifiers).

If an ingredient’s manifest is [remote](#_external_manifests), and the claim generator is unable to retrieve the manifest, it should use an error code of `manifest.inaccessible` to reflect that.

<a id="_connecting_the_signature"></a>
