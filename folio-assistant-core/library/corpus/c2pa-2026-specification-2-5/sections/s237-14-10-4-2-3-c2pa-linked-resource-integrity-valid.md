---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s237-14-10-4-2-3-c2pa-linked-resource-integrity-valid
section_title: "14.10.4.2.3. `c2pa.linked-resource-integrity` validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3195-3248
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.10.4.2.3. `c2pa.linked-resource-integrity` validation

If the assertion’s label is `c2pa.linked-resource-integrity`:

1.  Check that the assertion appears in the claim’s `created_assertions` array. If it does not, the claim shall be rejected with a failure code of `assertion.linkedResourceIntegrity.notCreated`.
    
2.  Check that the assertion’s `resources` field is an object containing either a non-empty `externalResources` array, or a non-empty `relativeResources` array together with an `alg` field. If the `resources` field is missing or matches neither of these shapes, the claim shall be rejected with a failure code of `assertion.linkedResourceIntegrity.malformed`.
    
3.  Every success, informational, or failure code reported under this procedure for a specific entry in the `externalResources` or `relativeResources` array shall include a `resourceUrl` field in its status result, set to the value of that entry’s `url` or `uri` field.
    
4.  For each well-formed entry in the `externalResources` or `relativeResources` array, the validator shall report exactly one terminal code for that entry, as determined by the steps below: an informational code of `assertion.linkedResourceIntegrity.skipped` if a validator does not attempt to retrieve its data; otherwise, if a validator attempts to retrieve its data, exactly one of a success code of `assertion.linkedResourceIntegrity.match`, or an informational code of `assertion.linkedResourceIntegrity.inaccessible`, `assertion.linkedResourceIntegrity.sizeMismatch`, `assertion.linkedResourceIntegrity.formatMismatch`, or `assertion.linkedResourceIntegrity.hashMismatch`. None of these codes, when reported under this procedure, shall cause the claim to be rejected.
    
5.  If `resources` contains an `externalResources` array:
    
    1.  For each entry in the `externalResources` array, check that `url`, `alg`, and `hash` fields are all present. If any are missing, the claim shall be rejected with a failure code of `assertion.linkedResourceIntegrity.malformed`.
        
    2.  For each entry in the `externalResources` array whose data a validator chooses to retrieve, the validator shall perform the resolution, size-comparison, content-type-comparison, algorithm-determination, and hash-comparison steps described in [Section 14.10.5.2, “Validation of External References”](#_validation_of_external_references), except that:
        
        1.  If the URI cannot be resolved or the data otherwise cannot be obtained, including when the validator aborts the attempt by applying a countermeasure described in [Section 14.10.5.3, “Retrieval Security”](#_retrieval_security), the validator shall report an informational code of `assertion.linkedResourceIntegrity.inaccessible` as the terminal code for that entry.
            
        2.  If the size-comparison step would return a failure code of `assertion.hashedURI.mismatch`, the validator shall instead report an informational code of `assertion.linkedResourceIntegrity.sizeMismatch` for that entry.
            
        3.  If the content-type-comparison step would return a failure code of `assertion.hashedURI.mismatch`, the validator shall instead report an informational code of `assertion.linkedResourceIntegrity.formatMismatch` for that entry.
            
        4.  If the hash-comparison step would return a failure code of `assertion.hashedURI.mismatch`, the validator shall instead report an informational code of `assertion.linkedResourceIntegrity.hashMismatch` for that entry.
            
        5.  Otherwise, the validator shall report a success code of `assertion.linkedResourceIntegrity.match` for that entry.
            
        
    
6.  If `resources` contains a `relativeResources` array:
    
    1.  For each entry in the `relativeResources` array, check that `uri` and `hash` fields are both present. If either is missing, the claim shall be rejected with a failure code of `assertion.linkedResourceIntegrity.malformed`.
        
    2.  The shared `alg` field shall be validated as described in [Section 14.4.4, “Algorithm validation”](#_algorithm_validation). If it is not present in either the allowed list or the deprecated list, the claim shall be rejected with a failure code of `algorithm.unsupported`. If it is present in the deprecated list, the validator shall report an informational code of `algorithm.deprecated`.
        
    3.  Before use, a validator shall percent-decode the value of each entry’s `uri` field and validate the decoded URI, ensuring that no path segment of the decoded URI (i.e., a substring delimited by `/`) is exactly `..`. If this is found, the manifest shall be rejected with a failure code of `assertion.linkedResourceIntegrity.invalidURI`. A path segment that is exactly `.` is permitted, as it does not enable traversal outside the base location.
        
    4.  For each entry in the `relativeResources` array whose data a validator chooses to retrieve:
        
        1.  If the URI cannot be resolved or the data otherwise cannot be obtained, the validator shall report an informational code of `assertion.linkedResourceIntegrity.inaccessible` for that entry.
            
        2.  If the `size` field is present and the size of the retrieved data does not equal its value, the validator shall report an informational code of `assertion.linkedResourceIntegrity.sizeMismatch` for that entry.
            
        3.  If the `dc:format` field is present and the media type of the retrieved data does not match its value, the validator shall report an informational code of `assertion.linkedResourceIntegrity.formatMismatch` for that entry.
            
        4.  Otherwise, the hash of the retrieved data shall be computed using the determined algorithm over the decoded content of the resource, after any transfer or content encoding has been removed but before any character decoding, parsing, normalization, or other transformation. If the resultant hash does not match the value of the `hash` field, the validator shall report an informational code of `assertion.linkedResourceIntegrity.hashMismatch` for that entry.
            
        5.  Otherwise, the validator shall report a success code of `assertion.linkedResourceIntegrity.match` for that entry.
            
        
    

<a id="_c2pa_actions_validation"></a>
