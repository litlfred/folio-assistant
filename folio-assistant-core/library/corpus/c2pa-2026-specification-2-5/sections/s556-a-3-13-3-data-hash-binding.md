---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s556-a-3-13-3-data-hash-binding
section_title: "A.3.13.3. Data hash binding"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11122-11131
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.13.3. Data hash binding

The `c2pa.hash.data` assertion shall reference the entire file with a single exclusion range covering the `C2PA` block data:

*   `start`: byte offset of the `C2PA` block data (immediately after the block’s 4-byte type and 4-byte length fields)
    
*   `length`: byte length of the `C2PA` block data
    

<a id="_writing_a_manifest_store_2"></a>
