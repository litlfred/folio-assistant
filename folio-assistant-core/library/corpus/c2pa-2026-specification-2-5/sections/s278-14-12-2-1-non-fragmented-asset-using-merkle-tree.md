---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s278-14-12-2-1-non-fragmented-asset-using-merkle-tree
section_title: "14.12.2.1. Non-fragmented asset using Merkle tree"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3886-3897
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.12.2.1. Non-fragmented asset using Merkle tree

If the `bmff-hash-map.merkle` field is present, the validator shall [validate the Merkle tree](#bmff-validation). If the `merkle-map.fixedBlockSize` and `merkle-map.variableBlockSizes` fields are not present, the whole payload of the `mdat` is treated as a single leaf node for hash calculation. If the `fixedBlockSize` is present and if `variableBlockSizes` is not present, the payload of the `mdat` is divided into fixed-length blocks, and each block is treated as a leaf node. If the final block exceeds the end of the mdat payload, the size of the last block should be set to extend only to the end of the mdat payload. If the `variableBlockSize` is present and if `fixedBlockSizes` is not present, the payload of the `mdat` is divided into sizes defined by the array of `variableBlockSizes`. If the number of elements is not equal to `count` or sum of the values is not equal to size of payload of mdat, then the manifest shall be rejected with a failure code of `assertion.bmffHash.malformed`. If the `merkle-map.fixedBlockSize` and `merkle-map.variableBlockSizes` fields are present, then the manifest shall be rejected with a failure code of `assertion.bmffHash.malformed`.

*   If `merkle-map.count` is equal to the number of elements of `merkle-map.hashes`, and if the hash of a leaf node doesn’t match the corresponding element of `merkle-map.hashes`, then the manifest shall be rejected with a failure code of `assertion.bmffHash.mismatch`.
    
*   If `merkle-map.count` is larger than the number of elements of `merkle-map.hashes`, and if the auxiliary `uuid` C2PA box doesn’t exist as described in [Section A.5.3, “Auxiliary `'c2pa'` Boxes for Large and Fragmented Files”](#_auxiliary_c2pa_boxes_for_large_and_fragmented_files), then the manifest shall be rejected with a failure code of `assertion.bmffHash.malformed`. If the hash calculated from the auxiliary `uuid` C2PA box and leaf node doesn’t match the corresponding element of `merkle-map.hashes`, then the manifest shall be rejected with a failure code of `assertion.bmffHash.mismatch`.
    
*   If `merkle-map.count` is smaller than the number of calculated leaf nodes (either the number of auxiliary uuid C2PA boxes or the number of leaf node `merkle-map.hashes`), then the manifest shall be rejected with a failure code of `assertion.bmffHash.malformed`.
    

<a id="_fragmented_asset_using_merkle_tree"></a>
