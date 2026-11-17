---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s234-14-10-4-2-specific-assertion-validation
section_title: "14.10.4.2. Specific Assertion Validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3077-3103
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.10.4.2. Specific Assertion Validation

For each assertion, the validator shall check the assertion’s label and if it is listed below, the validator shall perform the specific validation steps for that assertion type. If the assertion’s label is not listed below, then that type of assertion does not require any additional validation steps beyond those already described.

*   `c2pa.cloud-data`, [Section 14.10.4.2.1, “`c2pa.cloud-data` validation”](#_c2pa_cloud_data_validation)
    
*   `c2pa.external-reference`, [Section 14.10.4.2.2, “`c2pa.external-reference` validation”](#_c2pa_external_reference_validation)
    
*   `c2pa.actions` or `c2pa.actions.v2`, [Section 14.10.4.2.4, “`c2pa.actions` validation”](#_c2pa_actions_validation)
    
*   `c2pa.linked-resource-integrity`, [Section 14.10.4.2.3, “`c2pa.linked-resource-integrity` validation”](#_c2pa_linked_resource_integrity_validation)
    
*   `c2pa.metadata`, [Section 14.10.4.2.5, “`c2pa.metadata` validation”](#_c2pa_metadata_validation)
    
*   `c2pa.session-keys`, [Section 14.10.4.2.6, “`c2pa.session-keys` validation”](#_c2pa_session_keys_validation)
    
*   `c2pa.time-stamp`, [Section 14.10.4.2.7, “`c2pa.time-stamp` validation”](#_c2pa_time_stamp_validation)
    
*   `c2pa.alternative-content-representation`, [Section 14.10.4.2.8, “`c2pa.alternative-content-representation` validation”](#alternative_content_representation_validation)
    

> **NOTE:**
> Ingredient assertions (`c2pa.ingredient` or `c2pa.ingredient.v2` or `c2pa.ingredient.v3`) are subject to additional validation at a different point in the validation process (see [Section 14.11, “Validate the Ingredients”](#_validate_the_ingredients)).

If the value of any field of a standard assertion is a `hashed_uri` or `hashed_ext_uri`, the validator shall perform the steps described in [Section 14.10.4.3, “Validation of References”](#_validation_of_references), except for the `activeManifest` field in `c2pa.ingredient.v3` and the entries of the `externalResources` array in `c2pa.linked-resource-integrity`, for which special validation behavior is specified in [Section 14.11.3, “Ingredient Assertion Validation”](#_ingredient_assertion_validation) and [Section 14.10.4.2.3, “`c2pa.linked-resource-integrity` validation”](#_c2pa_linked_resource_integrity_validation) respectively.

<a id="_c2pa_cloud_data_validation"></a>
