---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s264-14-11-3-3-1-claim-signature-hash-validation-meth
section_title: "14.11.3.3.1. Claim Signature Hash Validation Method"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3680-3716
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.11.3.3.1. Claim Signature Hash Validation Method

This method includes a full validation of the ingredient’s claim, like that performed for the active manifest, except that content bindings are not evaluated:

1.  Resolve the URI reference in the `url` value of the `claimSignature` field to obtain the ingredient’s claim signature box. If the URI reference cannot be resolved, or the `claimSignature` field is not present, the ingredient claim is rejected with a failure code of `ingredient.claimSignature.missing`.
    
2.  Determine the hash algorithm identifier (or possible failure code) by following the procedure in [Section 14.4, “Determining the hashing algorithm”](#_determining_the_hashing_algorithm).
    
3.  Compute the hash of the ingredient claim signature box using that algorithm and the procedure described in [Section 9.4.2.3, “Hashing JUMBF Boxes”](#_hashing_jumbf_boxes).
    
4.  Compare the computed hash with the value in the `hash` field.
    
    1.  If the hashes are not equal or the `hash` field is not present:
        
        1.  Reject the claim with a failure code of `ingredient.claimSignature.mismatch`.
            
        
    2.  If the hashes are equal, issue a `ingredient.claimSignature.validated`.
        
        1.  Validate the claim signature, time stamp, and credential revocation information as per [Section 14.7, “Validate the Signature”](#_validate_the_signature), [Section 14.8, “Validate the Time Stamp”](#_validate_the_time_stamp), and [Section 14.9, “Validate the Credential Revocation Information”](#_validate_the_credential_revocation_information).
            
        2.  For each URI in the list of redacted assertions with a matching [manifest label](#manifest-identifier), if the referenced assertion is present and any JUMBF Content box or padding box within it contains anything other than zero or more `0x00` bytes (see [Section 14.10.3, “Redacted Assertion Representation”](#_redacted_assertion_representation)), the claim shall be rejected with a failure code of `assertion.notRedacted`.
            
        3.  Validate each non-redacted assertion per [Section 14.10, “Validate the Assertions”](#_validate_the_assertions), except for the hard binding assertions, which cannot be validated for ingredients.
            
        
    

When using the claim signature hash validation method, the validator shall not record hash mismatch failure codes for the `activeManifest` field.

> **NOTE:**
> The reason for this is that if redactions affect the referenced manifest, it is possible that the hash for this field would not match.

> **NOTE:**
> When assertions are redacted in an ingredient manifest that is referenced via either of the deprecated ingredient assertions (`c2pa.ingredient` or `c2pa.ingredient.v2`), validation of that assertion will fail (as described in [Section 14.11.3, “Ingredient Assertion Validation”](#_ingredient_assertion_validation)), because only `c2pa.ingredient.v3` assertions have a `claimSignature` field and can therefore use the claim signature hash validation method, which is necessary for validating manifests with redacted assertions.

<a id="_manifest_hash_validation_method"></a>
