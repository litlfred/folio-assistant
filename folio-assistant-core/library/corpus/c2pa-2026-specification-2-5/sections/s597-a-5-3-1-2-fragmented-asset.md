---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s597-a-5-3-1-2-fragmented-asset
section_title: "A.5.3.1.2. Fragmented asset"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11656-11678
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### A.5.3.1.2. Fragmented asset

For fMP4 assets which are split across multiple files:

*   One `ContentProvenanceBox` box with `box_purpose` set to `'merkle'` as described below shall be included in each fragment file immediately preceding the `'moof'` box.
    
*   The hash used for a given leaf node in the Merkle tree shall be over all data in its containing single fragment file except data excluded by the exclusion list.
    

> **NOTE:**
> This specification does not enable support for fMP4 assets which are split across multiple files where individual fragment files contain more than one `'moof'` box or `'mdat'` box or both.

For fMP4 assets which are stored as a single flat MP4 file with a single `'moov'` for all tracks and then one `'moof'`/`'mdat'` pair for each fragment:

*   One `ContentProvenanceBox` box with `box_purpose` set to `'merkle'` as described below shall be included immediately preceding each `'moof'` box.
    
*   The hash used for a given leaf node in the Merkle tree shall be over that `'moof'` box plus all data preceding the next `'moof'` box or over all data through the end of the file if there is no further `'moof'` box. The hash shall not cover data excluded by the exclusion list.
    

> **IMPORTANT:**
> Taking a C2PA-compliant fMP4 asset which is split across multiple files (i.e., has `'c2pa'` boxes of types `'manifest'` and `'merkle'`) and appending the individual files together will not produce a single file which is C2PA-compliant (nor vice-versa). This is because which boxes are included in each `'merkle'` hash will be different in the two cases. If both forms are desirable, the second form shall consider the first form as an ingredient and the new manifest shall include both an ingredient assertion with relationship `parentOf` and an actions assertion that includes an action of type `c2pa.repackaged`.

<a id="_live_media_fragmented_asset"></a>
