---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s262-14-11-3-2-performing-explicit-validation
section_title: "14.11.3.2. Performing explicit validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3563-3591
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.11.3.2. Performing explicit validation

If the `relationship` field is not present in an ingredient assertion, the assertion shall be rejected with a failure code of `assertion.ingredient.malformed`.

The value of the `relationship` field shall be one of the following: `parentOf`, `inputTo`, or `componentOf`. If the value of the `relationship` field is not one of these, the assertion shall be rejected with a failure code of `assertion.ingredient.malformed`.

If both an `activeManifest` and a `digitalSourceType` field are present, the assertion shall be rejected with a failure code of `assertion.ingredient.malformed`.

If a `relatedAssertions` field is present:

1.  If the value of `relatedAssertions` is not an array with at least one element, the assertion shall be rejected with a failure code of `assertion.ingredient.malformed`.
    
2.  For each element of the `relatedAssertions` array:
    
    1.  Validate the hashed URI as described in [Section 14.10.4.3, “Validation of References”](#_validation_of_references).
        
    2.  Resolve the hashed URI to locate the referenced assertion.
        
    3.  If the referenced assertion cannot be resolved, or does not resolve to an assertion (which may or may not be redacted) within the same C2PA Manifest as the ingredient assertion, the assertion shall be rejected with a failure code of `assertion.ingredient.malformed`.
        
    4.  If the referenced assertion is of type `c2pa.ingredient`, `c2pa.ingredient.v2`, `c2pa.ingredient.v3`, `c2pa.actions`, or `c2pa.actions.v2`, the assertion shall be rejected with a failure code of `assertion.ingredient.malformed`.
        
    5.  If the referenced assertion’s label, disregarding any [multiple-instance suffix](#_multiple_instances), does not end with `.ingredient`, the assertion shall be rejected with a failure code of `assertion.ingredient.malformed`.
        
    6.  If the referenced assertion has been redacted (it can be found in the [list of redacted assertions](#_preparing_the_list_of_redacted_assertions)), the informational code `assertion.redacted` shall be recorded.
        
    

<a id="_performing_recursive_validation"></a>
