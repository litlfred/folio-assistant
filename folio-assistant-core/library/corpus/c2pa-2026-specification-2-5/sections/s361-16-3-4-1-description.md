---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s361-16-3-4-1-description
section_title: "16.3.4.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 5794-5805
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.4.1. Description

In workflows where it is known in advance that the C2PA Manifest will refer to a collection of assets, instead of a single asset, the collection data hash assertion shall be used as the method to specify the [hard bindings](#_hard_bindings) (i.e., cryptographic hashes) for the assets in the collection.

> **NOTE:**
> It is possible to describe each folder of the training data set of an AI/ML model by having each folder be a separate ingredient of the complete training data set’s manifest.

A collection data hash assertion shall have a label of `c2pa.hash.collection.data`.

A collection data hash assertion shall not appear in a [cloud data assertion](#_cloud_data).

<a id="_schema_and_example_5"></a>
