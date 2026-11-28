---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s596-a-5-3-1-1-non-fragmented-asset-that-can-be-valid
section_title: "A.5.3.1.1. Non-fragmented asset that can be validated piecewise"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11640-11655
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### A.5.3.1.1. Non-fragmented asset that can be validated piecewise

If the manifest contains a non-leaf row of the merkle tree, two or more `ContentProvenanceBox` with `box_purpose` set to `'merkle'` as described below shall be included in the file. They are not required to be included in the file if the manifest contains the leaf row of the merkle tree. If they exist, they shall follow the last `'mdat'` box in the file.

The hash used for a given leaf node in the merkle tree shall be computed from the subset of payload of the `'mdat'`. The `'mdat'` is divided into sizes defined by `'fixedBlockSize'` or the array of `'variableBlockSizes'` found in the `merkle-map`, and sum of the `'variableBlockSizes'` shall be equal to size of the `'mdat'` payload.

All such `ContentProvenanceBox` boxes shall meet the following requirements.

*   They shall be in the same sequence as the subsets they hash as specified by the `'variableBlockSizes'` field.
    
*   They shall be grouped such that a single merkle tree’s `ContentProvenanceBox` boxes are sequential with no intervening boxes.
    
*   The `location` value in the first box shall be set to 0, in the second box shall be set to 1, and shall increase sequentially thereafter.
    

<a id="_fragmented_asset"></a>
