---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s433-16-5-8-2-multi-file-ingredients
section_title: "16.5.8.2. Multi-file Ingredients"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8461-8468
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.5.8.2. Multi-file Ingredients

In some cases, an ingredient may be represented as a set of multiple files, such as the training data set for an AI/ML model. It is recommended that in those instances that the [C2PA Manifest](#_existing_manifests) be included in the ingredient assertion and that the C2PA Manifest for the full data set include an [asset reference assertion](#_asset_reference) that references where to find those files.

> **NOTE:**
> This method is well suited for when working with a collection of assets where all of the files are not contained in the same hierarchy.

<a id="_informational_uri"></a>
