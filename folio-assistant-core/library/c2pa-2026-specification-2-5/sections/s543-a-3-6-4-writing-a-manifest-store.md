---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s543-a-3-6-4-writing-a-manifest-store
section_title: "A.3.6.4. Writing a Manifest Store"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10957-10972
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.6.4. Writing a Manifest Store

To embed a C2PA Manifest Store:

1.  Reserve an `FF 7F` event in the designated track immediately before the `FF 2F` End of Track event, with a data field consisting of the 3-byte extended manufacturer identifier `0x00 0x43 0x32` followed by a placeholder C2PA Manifest Store of the required size.
    
2.  Compute the data hash over the complete file with the placeholder manifest store bytes excluded.
    
3.  Sign the manifest using the computed data hash.
    
4.  Replace the placeholder bytes with the signed C2PA Manifest Store, preserving the exact byte length of the placeholder. The variable-length `<length>` field of the `FF 7F` event encodes the total byte length of the data field (including the 3-byte extended manufacturer identifier); its value and varint byte-length encoding shall remain unchanged between passes.
    

This follows the standard C2PA Manifest embeddable flow.

<a id="_re_embedding_a_manifest_store"></a>
