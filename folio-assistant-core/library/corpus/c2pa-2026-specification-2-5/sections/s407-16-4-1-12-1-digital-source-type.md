---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s407-16-4-1-12-1-digital-source-type
section_title: "16.4.1.12.1. Digital Source Type"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 7134-7147
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.4.1.12.1. Digital Source Type

The `digitalSourceType` of an ingredient can be established in one of two ways, depending on whether the ingredient has an active manifest:

*   If the ingredient has an active manifest, its `digitalSourceType` could be inferred from information provided by that manifest, as described in [Section 16.4.1.4.5, “Digital Source Type”](#_digital_source_type).
    
*   If the ingredient does not have an active manifest, the ingredient assertion itself may carry a `digitalSourceType` field, as described in [Section 16.5.12, “Existing manifests”](#_existing_manifests), making a statement about the ingredient’s nature equivalent to signing a full C2PA Manifest for it with a `c2pa.created` action having the same `digitalSourceType`.
    

As stated in [Section 16.5.12, “Existing manifests”](#_existing_manifests), an ingredient assertion shall not contain both an `activeManifest` and a `digitalSourceType` key.

It is possible that an ingredient does not declare a `digitalSourceType`.

<a id="_deprecated_actions"></a>
