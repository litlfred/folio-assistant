---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s292-14-12-6-3-validating-the-chain-of-checkpoints
section_title: "14.12.6.3. Validating the chain of checkpoints"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4047-4063
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.12.6.3. Validating the chain of checkpoints

Each checkpoint after the first records the position and digest of the sentinel line of the checkpoint that precedes it, and references that checkpoint’s manifest as a `parentOf` ingredient. Beginning with the active checkpoint, the validator shall, for each checkpoint whose segment hash assertion contains a `predecessorSentinel` field:

1.  Read the bytes `[predecessorSentinel.start, predecessorSentinel.start + predecessorSentinel.length)` of the file and compute their hash. If the resultant hash does not match the value of the `predecessorSentinel.hash` field, then the manifest shall be rejected with a failure code of `assertion.segmentHash.predecessorMismatch`.
    
2.  Obtain the C2PA Manifest Store of the preceding checkpoint from those bytes, by decoding the `data:` URI or by resolving the external URI as described in [Section 14.5.2.5, “Special Considerations for Append-Only Text Files”](#_locating_append_only_text), and validate its segment hash assertion as described in [Section 14.12.6.1, “General”](#_validating_a_segment_hash_general) and [Section 14.12.6.2, “Coverage of the asset”](#_validating_a_segment_hash_coverage).
    

A checkpoint whose segment hash assertion contains no `predecessorSentinel` field is the first checkpoint in the file, and the chain is complete.

If the C2PA Manifest Store of a checkpoint other than the active checkpoint is stored at an external URI and cannot be retrieved, then the validator shall report `manifest.inaccessible` and shall treat the segments covered by that checkpoint and every earlier checkpoint as unverified. The active checkpoint shall not be rejected on that basis alone.

> **NOTE:**
> An inaccessible checkpoint earlier in the chain limits how much of the file’s history can be verified, but it does not affect the binding between the active checkpoint and the segment it covers, which is verified from the file’s own bytes.

<a id="live-media"></a>
