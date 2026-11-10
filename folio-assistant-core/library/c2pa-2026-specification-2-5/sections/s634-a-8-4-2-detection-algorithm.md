---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s634-a-8-4-2-detection-algorithm
section_title: "A.8.4.2. Detection Algorithm"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12140-12158
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.8.4.2. Detection Algorithm

A validator processing a text asset shall use the following method to identify the `C2PATextManifestWrapper`:

1.  Scan the text from beginning to end for a Zero-Width No-Break Space (`U+FEFF`).
    
2.  For each `U+FEFF` found, check that the subsequent contiguous sequence of Unicode Variation Selectors (`U+FE00`\-`U+FE0F`, `U+E0100`\-`U+E01EF`) is a potential wrapper.
    
3.  For each potential wrapper:
    
    1.  Decode the first 8 variation selectors into bytes and check if they match the `magic` number `C2PATXT\0` (0x4332504154585400).
        
    2.  If the magic number matches, proceed to decode and parse the rest of the `C2PATextManifestWrapper` structure to extract the C2PA Manifest Store.
        
    3.  If the magic number does not match, or the structure cannot be fully decoded and parsed, the candidate is not a valid wrapper and shall be ignored.
        
    

<a id="deterministic_wrapper_padding"></a>
