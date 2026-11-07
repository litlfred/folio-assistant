---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s242-14-10-4-2-8-c2pa-alternative-content-representat
section_title: "14.10.4.2.8. `c2pa.alternative-content-representation` validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3357-3389
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.10.4.2.8. `c2pa.alternative-content-representation` validation

If the assertion’s label is `c2pa.alternative-content-representation`, a validator shall perform the following steps:

1.  If the `type` field is `exif.originalPreservationImage`, the validator shall proceed to the original preservation image representation validation defined in `original-preservation-image-representation validation`.
    

**original-preservation-image-representation validation**

1.  Check that no more than one `c2pa.alternative-content-representation` assertion where the `type` field is `exif.originalPreservationImage` is present in the active manifest. If more than one is found, the active manifest shall be rejected with a failure code of `assertion.alternativeContentRepresentation.malformed`.
    
2.  The `original-preservation-image-params` contains either the `multiAssetPartIndex` field or the `embeddedOriginalPreservationImage` field. If both fields are present, or neither is present, the assertion shall be rejected with a failure code of `assertion.alternativeContentRepresentation.malformed`.
    
3.  If the `multiAssetPartIndex` field is present and parameters is present in the active manifest:
    
    1.  If the active manifest does not include a `c2pa.hash.multi-asset` assertion, the assertion shall be rejected with a failure code of `assertion.alternativeContentRepresentation.malformed`.
        
    2.  The `multiAssetPartIndex` field shall be a valid zero-based index for an element within the parts array of the located c2pa.hash.multi-asset assertion. If the index is out of bounds (i.e., greater than or equal to the total length of the parts array), the assertion shall be rejected with a failure code of `assertion.alternativeContentRepresentation.malformed`.
        
    
4.  If the `embeddedOriginalPreservationImage` field is present:
    
    1.  Resolve the URI reference in the `embeddedOriginalPreservationImage` field to obtain the data of this embedded data assertion.
        
    2.  The `embeddedOriginalPreservationImage` field shall be a hashed-uri-map structure, and its hash field shall be present. If this hash field is missing, the assertion shall be rejected with a failure code of `assertion.alternativeContentRepresentation.malformed`.
        
    3.  Compute the hash of the resolved embedded data using the determined algorithm. If the computed hash does not match the hash value provided in the `embeddedOriginalPreservationImage` field, the assertion shall be rejected with a failure code of `assertion.alternativeContentRepresentation.hashMismatch`.
        
    
5.  If no failure codes are encountered during the validation of the `c2pa.alternative-content-representation` assertion, a success code of `assertion.alternativeContentRepresentation.match` shall be recorded.
    

<a id="_validation_of_references"></a>
