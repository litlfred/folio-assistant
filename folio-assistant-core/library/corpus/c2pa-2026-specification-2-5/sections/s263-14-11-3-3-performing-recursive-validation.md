---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s263-14-11-3-3-performing-recursive-validation
section_title: "14.11.3.3. Performing recursive validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3592-3679
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.11.3.3. Performing recursive validation

The validator shall recursively validate all ingredient manifests in the asset, for example using a depth-first search as described below. A validator need not implement the algorithm exactly as described, but the results of the validation shall be equivalent to the results of this algorithm.

1.  Create two empty lists:
    
    1.  A list to hold the `hashed_uri` values of all ingredient manifests used in the asset, anywhere in its lineage.
        
    2.  A list to hold the JUMBF URIs of all redacted assertions in the asset, anywhere in its lineage.
        
    
2.  Set the active manifest of the asset being validated as the target manifest
    
3.  Begin recursion.
    
4.  Locate the claim, as described in [Section 14.6, “Locating and Validating the Claim”](#validating_the_claim). If unable to, reject claim with a `claim.missing` failure code.
    
5.  If the claim of the target manifest contains a `redacted_assertions` field, check the JUMBF URI of each redacted assertion.
    
    1.  If the redacted assertion is from the target manifest, reject the claim with an `assertion.selfRedacted` failure code.
        
    2.  Otherwise, append the JUMBF URI of the redacted assertion to the list of all redacted assertions.
        
    
6.  If the claim of the target manifest includes ingredient assertions:
    
    1.  For each ingredient assertion:
        
        1.  Attempt to resolve the hashed URI of the ingredient assertion. If the URI does not resolve, or the hash does not match, or the assertion’s JUMBF Content boxes contain only zeros, skip to the next ingredient assertion.
            
        2.  If the ingredient assertion has an `activeManifest` field (or `c2pa_manifest` field in a v1 or v2 ingredient assertion):
            
            1.  Append a tuple that includes the following values to the list of all ingredient manifests:
                
                *   The `hashed_uri` value of the `activeManifest` (or `c2pa_manifest`) field in the ingredient assertion
                    
                *   The `hashed_uri` value of the `claimSignature` field in the ingredient assertion
                    
                
            2.  Set the just-appended ingredient manifest as the target manifest, and repeat the process as above from the "Begin recursion" step.
                
            
        3.  If the ingredient assertion has a `validationResults` field, return each status code within it as part of the validation results.
            
        4.  Skip to the next ingredient assertion until they are all exhausted. At that point, return from the current recursion level.
            
        
    
7.  If the claim of the target manifest does not include ingredient assertions, return from the current recursion level.
    
8.  End recursion.
    

Having compiled a list of all ingredient manifests and a list of all redacted assertions, the validator shall perform the following validation algorithm:

1.  For each ingredient manifest in the list of all ingredient manifests:
    
    1.  Extract the [manifest label](#manifest-identifier) from the ingredient manifest JUMBF URI from each tuple
        
    2.  Search the list of all redacted assertions for assertions with a matching [manifest label](#manifest-identifier)
        
    3.  If one or more matching redacted assertions are found:
        
        1.  Validate the ingredient using the claim signature hash validation method, described in [Section 14.11.3.3.1, “Claim Signature Hash Validation Method”](#_claim_signature_hash_validation_method).
            
        
    4.  If no matching redacted assertions are found:
        
        1.  Validate the ingredient using either the manifest hash validation method, described in [Section 14.11.3.3.2, “Manifest Hash Validation Method”](#_manifest_hash_validation_method), or the claim signature hash validation method, described in [Section 14.11.3.3.1, “Claim Signature Hash Validation Method”](#_claim_signature_hash_validation_method).
            
        
    5.  If the ingredient assertion contains a `validationResults` field:
        
        1.  For each entry in the value of the `validationResults` field, if an equivalent entry was not returned as part of the validation process, return it as part of the validation results.
            
        2.  If there are any entries returned as part of the validation process that are not present in the `validationResults` field, return it as part of the validation results.
            
        
    6.  If no `validationResults` field is present and the ingredient assertion is a v3 ingredient assertion with the `activeManifest` field present, then return the failure code `assertion.ingredient.malformed`.
        
    

Validators should ignore any additional C2PA Manifests that appear in the C2PA Manifest Store but are not in the list of ingredient manifests.

> **NOTE:**
> Ignoring additional C2PA Manifests supports compatibility with custom assertions and future constructs that may reference C2PA Manifests in ways that the validator does not recognize.

<a id="_claim_signature_hash_validation_method"></a>
