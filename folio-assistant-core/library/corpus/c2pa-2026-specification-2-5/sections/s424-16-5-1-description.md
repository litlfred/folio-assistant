---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s424-16-5-1-description
section_title: "16.5.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8091-8102
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 16.5.1. Description

When assets are composed together, for example placing an image into a layer in an image editing tool or an audio clip into a video in a video editing tool, it is important that information about any claim from the placed asset be recorded into the new asset to provide a way to understand the entire history of the new composed asset. This is also true when an existing asset is used to create a derived asset or asset rendition.

Another common use for an ingredient is to describe some assets or data that were used as input to a process, such as the training or inference requests associated with an AI/ML model.

There are three versions of the ingredients assertion - the deprecated v1 (with label `c2pa.ingredient`), the deprecated v2 (with label `c2pa.ingredient.v2`), and the current v3 (which shall have a label of `c2pa.ingredient.v3`), which addresses the issue of validating ingredients after redaction.

> **NOTE:**
> When there is more than one ingredient assertion, the [usual labelling rules](#_multiple_instances) apply (e.g., `c2pa.ingredient.v3`, `c2pa.ingredient.v3__1`, `c2pa.ingredient.v3__2`).

<a id="_establishing_unique_identifiers"></a>
