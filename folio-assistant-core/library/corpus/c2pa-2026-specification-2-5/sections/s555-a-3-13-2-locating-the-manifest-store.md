---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s555-a-3-13-2-locating-the-manifest-store
section_title: "A.3.13.2. Locating the Manifest Store"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11102-11121
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.13.2. Locating the Manifest Store

To extract the C2PA Manifest Store:

1.  Read and verify the magic bytes (4 bytes).
    
2.  Read the metadata length _N_ (4 bytes, big-endian).
    
3.  Parse the JSON metadata (_N_ bytes) to obtain `media_length` (_M_).
    
4.  Skip the media payload (_M_ bytes).
    
5.  Read the extension block count (2 bytes, big-endian).
    
6.  Iterate extension blocks: for each, read type (4 bytes) + length _L_ (4 bytes) + data (_L_ bytes).
    
7.  The block with type `C2PA` contains the C2PA Manifest Store.
    

<a id="_data_hash_binding_2"></a>
