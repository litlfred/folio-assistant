---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s170-13-3-4-well-formed-manifest
section_title: "13.3.4. Well-Formed Manifest"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2171-2184
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 13.3.4. Well-Formed Manifest

A C2PA Manifest is Well-Formed if validation determines that each of the following is true:

*   The manifest’s contents abide by the normative requirements of this specification, that are validated via the [validation process](#_validation_process).
    
*   Only those assertions allowed for the [specific type](#_types_of_manifests) of the manifest are present \[[Section 14.10.1, “Validate the correct assertions for the type of manifest”](#_validate_the_correct_assertions_for_the_type_of_manifest)\].
    
*   The assertions of the manifest meet all the requirements for assertions \[[Section 14.10.4, “Assertion Validation”](#_assertion_validation)\].
    
*   Any ingredients present in the manifest meet all the requirements for ingredients \[[Section 14.11, “Validate the Ingredients”](#_validate_the_ingredients)\].
    

<a id="_valid_manifest"></a>
