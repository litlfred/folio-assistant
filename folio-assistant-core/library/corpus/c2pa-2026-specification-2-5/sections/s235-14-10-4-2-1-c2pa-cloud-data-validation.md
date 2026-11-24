---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s235-14-10-4-2-1-c2pa-cloud-data-validation
section_title: "14.10.4.2.1. `c2pa.cloud-data` validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3104-3149
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.10.4.2.1. `c2pa.cloud-data` validation

If the assertion’s label is `c2pa.cloud-data`:

1.  Check that the assertion contains the following fields: `label`, `size`, and `location`. If any of those fields are missing, the claim shall be rejected with a failure code of `assertion.cloud-data.malformed`.
    
2.  If the `label` field of the external assertion is any of the following values, the claim shall be rejected with a failure code of `assertion.cloud-data.hardBinding`.
    
    1.  `c2pa.hash.bmff.v2` (deprecated)
        
    2.  `c2pa.hash.bmff.v3`
        
    3.  `c2pa.hash.boxes`
        
    4.  `c2pa.hash.collection.data`
        
    5.  `c2pa.hash.data`
        
    6.  `c2pa.hash.multi-asset`
        
    7.  `c2pa.hash.segment`
        
    
3.  If the manifest is an update manifest and the `label` field of the external assertion is `c2pa.actions` or `c2pa.actions.v2`, the claim shall be rejected with a failure code of `assertion.cloud-data.actions`.
    
4.  If the `label` field of the external assertion is any of the following values, the claim shall be rejected with a failure code of `assertion.cloud-data.malformed`.
    
    1.  `c2pa.actions` (deprecated)
        
    2.  `c2pa.actions.v2`
        
    3.  `c2pa.cloud-data`
        
    4.  `c2pa.ingredient` (deprecated)
        
    5.  `c2pa.ingredient.v2` (deprecated)
        
    6.  `c2pa.ingredient.v3`
        
    
5.  The `location` field shall be validated according to [Section 14.10.5.2, “Validation of External References”](#_validation_of_external_references).
    
6.  If the data for the external assertion is retrieved (from the specified `location`), the label of the JUMBF box retrieved from that location shall match the value of the `label` field in the `c2pa.cloud-data` assertion. If it does not, the claim shall be rejected with a failure code of `assertion.cloud-data.labelMismatch`.
    

<a id="_c2pa_external_reference_validation"></a>
