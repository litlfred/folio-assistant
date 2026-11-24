---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s440-16-5-13-1-determining-the-need
section_title: "16.5.13.1. Determining the need"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8541-8576
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.5.13.1. Determining the need

To determine whether or not an existing manifest from the ingredient’s C2PA Manifest Store needs to be copied into the asset’s C2PA Manifest Store, the claim generator shall:

1.  Validate the ingredient per the process described in [Section 16.5.13.4, “Ingredient validation”](#_ingredient_validation). In case of validation failures, the claim generator may skip the rest of these steps if directed to do so (for example, via user input or via configuration).
    
2.  For each manifest in the ingredient’s C2PA Manifest Store, compare its [URN identifier](#_unique_identifiers) with the URN identifiers of each C2PA Manifest already present in the asset’s C2PA Manifest Store.
    
    1.  If a match is found, compute and compare the hash of the manifest box from ingredient’s C2PA Manifest Store to the hash of the matching manifest box from the asset’s C2PA Manifest Store
        
        1.  If the hashes match, then the claim generator shall not copy the manifest from the ingredient’s C2PA Manifest Store to the asset’s C2PA Manifest Store.
            
        2.  If the hashes do not match:
            
            1.  The claim generator shall check if any assertions from either manifest were redacted (optionally utilizing the list of redactions compiled in the [Performing explicit validation](#_performing_explicit_validation) process).
                
                1.  If the validator is able to determine that the hashes differ only due to redaction, then:
                    
                    1.  If all redactions were applied against the manifest already present in the asset’s C2PA Manifest Store, then the claim generator shall not copy the manifest from the ingredient’s C2PA Manifest Store into the asset’s C2PA Manifest Store.
                        
                    2.  If all redactions were applied against the manifest from the ingredient’s Manifest Store, then the claim generator shall replace the manifest in the asset’s C2PA Manifest Store with the manifest from the ingredient’s C2PA Manifest Store.
                        
                    3.  If different redactions were applied against both the C2PA Manifest from the ingredient’s C2PA Manifest Store and the asset’s C2PA Manifest Store, then the claim generator shall redact as many assertions as needed from the existing manifest in the asset’s C2PA Manifest Store to result in a union of the two sets of redactions.
                        
                    
                2.  In all other cases, then the claim generator shall copy the manifest from the ingredient’s C2PA Manifest Store, re-label it with an updated URN per the process described in [Unique Identifiers](#_unique_identifiers), and insert the re-labeled version into the asset’s C2PA Manifest Store.
                    
                
            
        
    

> **NOTE:**
> The process for determining whether the hashes differ only due to redaction is left up to the validator.

<a id="_examples"></a>
