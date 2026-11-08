---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s291-14-12-6-2-coverage-of-the-asset
section_title: "14.12.6.2. Coverage of the asset"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4026-4046
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.12.6.2. Coverage of the asset

The checkpoints present in a file shall together cover every byte of it, so that content cannot be added, removed or replaced without a covering checkpoint.

For the active checkpoint only, the validator shall verify that the sentinel line carrying its manifest ends at the end of the file, so that no content has been appended without a covering checkpoint. The end boundary shall be determined as follows:

*   If the `sentinelLength` field is present, the end boundary is `segmentEnd` plus `sentinelLength`.
    
*   If the `sentinelLength` field is absent, the end boundary is `segmentEnd` plus the actual byte length of the sentinel line, including its terminating line ending.
    

If the end boundary is not equal to the length of the file, then the manifest shall be rejected with a failure code of `assertion.segmentHash.partialCoverage`.

For a checkpoint whose segment hash assertion contains no `predecessorSentinel` field, the validator shall verify that the value of the `segmentStart` field is 0, so that the segment covered by the first checkpoint begins at the start of the file. If it is not, then the manifest shall be rejected with a failure code of `assertion.segmentHash.partialCoverage`.

For every other checkpoint, the validator shall verify that the value of the `segmentStart` field is equal to `predecessorSentinel.start` plus `predecessorSentinel.length`, so that the segment covered by this checkpoint begins immediately after the sentinel line of the checkpoint that precedes it. If it is not, then the manifest shall be rejected with a failure code of `assertion.segmentHash.partialCoverage`.

> **NOTE:**
> Taken together, these checks establish that every byte from the start of the file to the end of the active checkpoint’s sentinel line falls within exactly one segment or one sentinel line, leaving no gaps between consecutive checkpoints and none before the first or after the last.

<a id="_validating_the_chain_of_checkpoints"></a>
