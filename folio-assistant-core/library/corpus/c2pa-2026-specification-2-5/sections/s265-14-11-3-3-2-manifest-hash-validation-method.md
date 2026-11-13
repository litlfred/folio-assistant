---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s265-14-11-3-3-2-manifest-hash-validation-method
section_title: "14.11.3.3.2. Manifest Hash Validation Method"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3717-3738
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.11.3.3.2. Manifest Hash Validation Method

An ingredient manifest that has not been changed due to redaction can be validated faster if the current validator trusts the previous claim generator’s validation results:

1.  Resolve the URI reference in the `url` value of the `activeManifest` field to obtain the ingredient’s manifest box. If the `url` field is not present or the URI reference cannot be resolved, the ingredient claim is rejected with a failure code of `ingredient.manifest.missing`.
    
2.  Determine the hash algorithm identifier (or possible failure code) by following the procedure in [Section 14.4, “Determining the hashing algorithm”](#_determining_the_hashing_algorithm).
    
3.  Compute the hash of the ingredient manifest box using that algorithm and the procedure described in [Section 9.4.2.3, “Hashing JUMBF Boxes”](#_hashing_jumbf_boxes).
    
4.  Compare the computed hash with the value in the `hash` field.
    
    1.  If the hashes are not equal or the `hash` field is not present:
        
        1.  Reject the claim with a failure code of `ingredient.manifest.mismatch`.
            
        
    2.  If the hashes are equal, the ingredient is fully validated and a `ingredient.manifest.validated` success code is issued.
        
    

<a id="_validate_the_assets_content"></a>
