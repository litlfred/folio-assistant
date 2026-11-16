---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s574-a-3-17-4-chain-structure
section_title: "A.3.17.4. Chain structure"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11343-11349
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.17.4. Chain structure

Each checkpoint manifest shall reference the immediately preceding checkpoint manifest as a `parentOf` ingredient. The first checkpoint in a file has no predecessor and shall not include a `parentOf` ingredient for this purpose.

The rules for verifying a chain of checkpoints are defined in [Section 14.12.6, “Validating a segment hash”](#_validating_a_segment_hash).

<a id="_writing_a_checkpoint"></a>
