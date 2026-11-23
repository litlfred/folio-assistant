---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s279-14-12-2-2-fragmented-asset-using-merkle-tree
section_title: "14.12.2.2. Fragmented asset using Merkle tree"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3898-3902
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.12.2.2. Fragmented asset using Merkle tree

If the `bmff-hash-map.merkle` field is present, the validator shall [validate the Merkle tree](#bmff-validation). If the auxiliary `uuid` C2PA box doesn’t exist as described in [Section A.5.3, “Auxiliary `'c2pa'` Boxes for Large and Fragmented Files”](#_auxiliary_c2pa_boxes_for_large_and_fragmented_files), then the manifest shall be rejected with a failure code of `assertion.bmffHash.malformed`. If the hash calculated from the auxiliary `uuid` C2PA box and leaf node doesn’t match the corresponding element of `merkle-map.hashes`, then the manifest shall be rejected with a failure code of `assertion.bmffHash.mismatch`

<a id="_validating_a_general_box_hash"></a>
