---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s238-14-10-4-2-4-c2pa-actions-validation
section_title: "14.10.4.2.4. `c2pa.actions` validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3249-3337
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.10.4.2.4. `c2pa.actions` validation

If the assertion’s label is `c2pa.actions` or `c2pa.actions.v2`:

The `when`, `whenStart`, and `whenEnd` fields are claim generator provided timestamps annotate the time within which an action occurred. Validators shall apply the syntax and internal-consistency checks below but shall not compare these fields with an external time source.

1.  Ensure that it has an `actions` field. If not, the claim shall be rejected with a failure code of `assertion.action.malformed`.
    
2.  For each action in the `actions` list:
    
    1.  If the assertion’s label is `c2pa.actions.v2` and `when` is present together with `whenStart` or `whenEnd`, the claim shall be rejected with a failure code of `assertion.action.malformed`.
        
    2.  If the assertion’s label is `c2pa.actions.v2` and both `whenStart` and `whenEnd` are present, validate that the time value represented by `whenStart` is less than or equal to the time value represented by `whenEnd`. If not, the claim shall be rejected with a failure code of `assertion.action.malformed`.
        
    3.  If the `action` field is either `c2pa.created` or `c2pa.opened`, then the claim shall be rejected with a failure code of `assertion.action.malformed` unless all of the following are true:
        
        1.  the assertion is the first actions assertion in the `created_assertions` or `gathered_assertions` array (of a v2 claim), or the first actions assertion in the `assertions` array of a v1 claim, and
            
        2.  the action is the first element in the `actions` array in this assertion.
            
        
    4.  If the `action` field is `c2pa.opened`, `c2pa.placed`, or `c2pa.removed`:
        
        1.  If the action has no `parameters` field, or that field’s value is empty, the claim shall be rejected with a failure code of `assertion.action.ingredientMismatch`.
            
        2.  If the action’s `parameters` field contains no `ingredients` field (or `ingredient` field for `c2pa.actions`), the claim shall be rejected with a failure code of `assertion.action.ingredientMismatch`.
            
        3.  If the value of the `ingredients` field is not an array with at least one element, the claim shall be rejected with a failure code of `assertion.action.ingredientMismatch`.
            
        4.  Check references to ingredient assertions:
            
            1.  For `c2pa.opened`: Check that the `ingredients` field (or `ingredient` field for `c2pa.actions`) contains exactly one valid hashed URI, which resolves either to an ingredient assertion in the current manifest whose `relationship` field is `parentOf`, or to a redacted ingredient assertion in the current manifest (in the [list of redacted assertions](#_preparing_the_list_of_redacted_assertions)). If not, then the claim shall be rejected with a failure code of `assertion.action.ingredientMismatch`.
                
            2.  For `c2pa.placed`: Check that the `ingredients` field (or `ingredient` field for `c2pa.actions`) contains one or more valid hashed URIs, each of which resolves either to an ingredient assertion in the current manifest whose `relationship` field is `componentOf`, or to a redacted ingredient assertion in the current manifest (in the [list of redacted assertions](#_preparing_the_list_of_redacted_assertions)). If not, then the claim shall be rejected with a failure code of `assertion.action.ingredientMismatch`.
                
            3.  For `c2pa.opened` or `c2pa.placed`, in a v2 claim: Check that each resolved (non-redacted) ingredient assertion is listed in the same field of the claim (`created_assertions` or `gathered_assertions`) as this actions assertion. If not, then an informational code of `assertion.action.ingredientLocationMismatch` shall be returned.
                
            4.  For `c2pa.removed`: Check that the `ingredients` field (or `ingredient` field for `c2pa.actions`) contains one or more valid hashed URIs, each of which resolves either to an ingredient assertion in **another** manifest whose `relationship` field is `componentOf`, or to a redacted ingredient assertion in **another** manifest (in the [list of redacted assertions](#_preparing_the_list_of_redacted_assertions)). If not, then the claim shall be rejected with a failure code of `assertion.action.ingredientMismatch`.
                
            5.  For `c2pa.deleted`: If the `ingredients` field is present, check that it contains one or more valid hashed URIs, each of which resolves either to an ingredient assertion in **another** manifest whose `relationship` field is `componentOf`, or to a redacted ingredient assertion in **another** manifest (in the [list of redacted assertions](#_preparing_the_list_of_redacted_assertions)). If not, then the claim shall be rejected with a failure code of `assertion.action.ingredientMismatch`.
                
            
        
    5.  If the `action` field is `c2pa.transcoded` or `c2pa.repackaged`:
        
        1.  If the `ingredients` field (or `ingredient` field for `c2pa.actions`) is present, check that each element of that field is a valid hashed URI that resolves either to an ingredient assertion in the current manifest whose `relationship` field is `parentOf`, or to a redacted ingredient assertion in the current manifest (in the [list of redacted assertions](#_preparing_the_list_of_redacted_assertions)). If not, then the claim shall be rejected with a failure code of `assertion.action.ingredientMismatch`.
            
        
    6.  If the `action` field is `c2pa.redacted`:
        
        1.  Check the `redacted` field that is a member of the `parameters` object for the presence of a JUMBF URI. If the JUMBF URI is not present, or cannot be resolved to an assertion, the claim shall be rejected with a failure code of `assertion.action.redactionMismatch`.
            
        
    7.  If there is a `softwareAgent` field in the `action-common-map-v2` or one or more `softwareAgents` listed in the `softwareAgents` field of the `actions-map-v2`:
        
        1.  If there is an `icon` field in the `generator-info-map`, then it shall be validated as described in [Section 14.10.4.3, “Validation of References”](#_validation_of_references).
            
        
    8.  If the action’s `parameters` field exists and contains a `relatedAssertions` field:
        
        1.  If the value of `relatedAssertions` is not an array with at least one element, the claim shall be rejected with a failure code of `assertion.action.malformed`.
            
        2.  For each element of the `relatedAssertions` array:
            
            1.  Validate the hashed URI as described in [Section 14.10.4.3, “Validation of References”](#_validation_of_references).
                
            2.  Resolve the hashed URI to locate the referenced assertion.
                
            3.  If the referenced assertion cannot be resolved, or does not resolve to an assertion (which may or may not be redacted) within the current manifest, the claim shall be rejected with a failure code of `assertion.action.malformed`.
                
            4.  If the referenced assertion is of type `c2pa.ingredient`, `c2pa.ingredient.v2`, `c2pa.ingredient.v3`, `c2pa.actions`, or `c2pa.actions.v2`, the claim shall be rejected with a failure code of `assertion.action.malformed`.
                
            5.  If the referenced assertion has been redacted (it can be found in the [list of redacted assertions](#_preparing_the_list_of_redacted_assertions)), the informational code `assertion.redacted` shall be recorded.
                
            
        
    9.  If the `action` field is either `c2pa.watermarked` \[DEPRECATED\] or `c2pa.watermarked.bound`:
        
        1.  Verify that there is also a [`c2pa.soft-binding` assertion](#soft_binding_assertion) present in the manifest. If there is not, the claim shall be rejected with a failure code of `assertion.action.softBindingMissing`.
            
        
    10.  For each template in the `templates` list:
         
         1.  If there is an `icon` field in the `action-template-map-v2`, then it shall be validated as described in [Section 14.10.4.3, “Validation of References”](#_validation_of_references).
             
         
    

<a id="_c2pa_metadata_validation"></a>
