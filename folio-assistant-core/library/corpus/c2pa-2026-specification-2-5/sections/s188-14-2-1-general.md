---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s188-14-2-1-general
section_title: "14.2.1. General"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2508-2518
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.2.1. General

The validation algorithm shall return a consolidated set of validation results, per the [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) schema in [Section 14.2.2, “Validation Structures”](#_validation_structures), for the all manifests in the asset’s C2PA Manifest Store, including the active manifest as well all other manifests in the C2PA Manifest Store that are referenced via ingredient assertions.

Validation results include a standard set of success, informational, and failure codes, as defined in [Appendix D, _Standard Validation Status Codes_](#validation_codes_annex). Custom status codes are also permitted, when a claim generator has a need to record some process-specific status information. Custom codes shall conform to the same syntax as [entity-specific namespaces](#_namespacing), e.g. `com.litware`.

When a claim generator adds an ingredient asset via an ingredient assertion, it shall act as a validator, and perform the full validation algorithm described in this section on the ingredient. The claim generator shall record the validation results of the ingredient, per the [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) schema in [Section 14.2.2, “Validation Structures”](#_validation_structures), as the value of the `validationResults` field in the [ingredient assertion](#ingredient_assertion).

The validation results may contain a SemVer formatted `specVersion` field which represents the version of this specification that was used as the basis for the validation procedure. It may also contain either a `trustListUri` field (DEPRECATED) or a `trustListUris` field, identifying the trust list(s) that were used to [validate the claim signature](#_validate_the_signature); see [\[trust-list-validation\]](#trust-list-validation) for the structure of the `trustListUris` field and its defined `type` values.

<a id="_validation_structures"></a>
