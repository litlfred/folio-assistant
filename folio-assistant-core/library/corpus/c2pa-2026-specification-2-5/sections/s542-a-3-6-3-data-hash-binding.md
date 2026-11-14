---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s542-a-3-6-3-data-hash-binding
section_title: "A.3.6.3. Data hash binding"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10945-10956
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.6.3. Data hash binding

A claim generator embedding a manifest in a Standard MIDI File shall include a [`c2pa.hash.data`](#_data_hash) assertion with a single exclusion range:

*   `start`: the byte offset within the file of the first byte of the C2PA Manifest Store (i.e., the byte immediately after the `0x00 0x43 0x32` extended manufacturer identifier within the `FF 7F` data field)
    
*   `length`: the byte length of the C2PA Manifest Store
    

The `FF 7F` status bytes, the variable-length `<length>` field of the `FF 7F` event, and the 3-byte extended manufacturer identifier are not part of the exclusion range and shall remain unchanged between write passes.

<a id="_writing_a_manifest_store"></a>
