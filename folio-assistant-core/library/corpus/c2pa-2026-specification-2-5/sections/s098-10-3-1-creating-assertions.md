---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s098-10-3-1-creating-assertions
section_title: "10.3.1. Creating Assertions"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1393-1399
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 10.3.1. Creating Assertions

Before the claim can be finalized, all [assertions](#_assertions) need to be created and stored in a newly created [C2PA Assertion Store](#_assertion_store_contents) as described [later in this document](#_types_of_manifests).

When creating a standard manifest, it may not be possible to know all of the required binding information at the time of claim creation, in which case use the [multiple step processing method](#_multiple_step_processing) to setup and then later fill-in the information.

<a id="_preparing_the_claim"></a>
