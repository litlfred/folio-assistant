---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s236-14-10-4-2-2-c2pa-external-reference-validation
section_title: "14.10.4.2.2. `c2pa.external-reference` validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3150-3194
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.10.4.2.2. `c2pa.external-reference` validation

If the assertion’s label is `c2pa.external-reference`:

1.  Check that the assertion contains a `location` field with a `url` field. If it is missing, the claim shall be rejected with a failure code of `assertion.external-reference.malformed`.
    
2.  If the `location` field contains one of `alg` or `hash` but not both, the claim shall be rejected with a failure code of `assertion.external-reference.malformed`.
    
3.  If the `location` field contains both `alg` and `hash` (hashed variant) and the data is retrieved from the URI in the `location` field, the validator shall compute the hash of the retrieved data and compare it against the hash in the `location` field. If they do not match, the validator shall report a failure code of `assertion.external-reference.hashMismatch`.
    
4.  If the `label` field is present and its value is any of the following, the claim shall be rejected with a failure code of `assertion.external-reference.malformed`:
    
    1.  `c2pa.actions` (deprecated)
        
    2.  `c2pa.actions.v2`
        
    3.  `c2pa.cloud-data`
        
    4.  `c2pa.external-reference`
        
    5.  `c2pa.hash.bmff.v2` (deprecated)
        
    6.  `c2pa.hash.bmff.v3`
        
    7.  `c2pa.hash.boxes`
        
    8.  `c2pa.hash.collection.data`
        
    9.  `c2pa.hash.data`
        
    10.  `c2pa.hash.multi-asset`
         
    11.  `c2pa.hash.segment`
         
    12.  `c2pa.ingredient` (deprecated)
         
    13.  `c2pa.ingredient.v2` (deprecated)
         
    14.  `c2pa.ingredient.v3`
         
    
5.  If the `label` field is present and the data is retrieved from the URI in the `location` field, the label of the retrieved JUMBF box shall match the value of the `label` field. If it does not, the validator shall report a failure code of `assertion.external-reference.labelMismatch`.
    

<a id="_c2pa_linked_resource_integrity_validation"></a>
