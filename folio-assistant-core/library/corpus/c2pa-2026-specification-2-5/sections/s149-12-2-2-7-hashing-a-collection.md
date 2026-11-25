---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s149-12-2-2-7-hashing-a-collection
section_title: "12.2.2.7. Hashing a Collection"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1924-1931
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 12.2.2.7. Hashing a Collection

In workflows where the C2PA Manifest will refer to a collection of assets, instead of a single asset, the [collection data hash assertion](#_collection_data_hash) shall be used as the method to specify the hard bindings for the assets in the collection.

> **NOTE:**
> For example, a collection data hash assertion can be used to describe each folder of a training data set for an AI/ML model.

<a id="_hashing_assets_with_multiple_parts"></a>
