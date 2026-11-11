---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s356-16-3-3-3-5-riff-specific-handling
section_title: "16.3.3.3.5. RIFF-specific Handling"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 5424-5465
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.3.3.3.5. RIFF-specific Handling

RIFF file chunks may be nested in a tree structure of arbitrary depth. The root of this structure consists of one or more **L0** chunks, each with the chunk identifier of `RIFF`. These `RIFF` chunks are defined with the following structure:

*   Bytes 0-3: Chunk identifier, always `RIFF`.
    
*   Bytes 4-7: Chunk length (minus 8 bytes for the chunk identifier and chunk length fields).
    
*   Bytes 8-11: Media type identifier.
    
*   Bytes 12-n: Chunk data (all **L1** chunks).
    

After the media type identifier, the `RIFF` chunk may contain one or more **L1** sub-chunks, each with the following structure:

*   Bytes 0-3: Chunk identifier.
    
*   Bytes 4-7: Chunk length (minus 8 bytes for the chunk identifier and chunk length fields).
    
*   Bytes 8-n: Chunk data.
    
*   Byte n+1: Padding byte (if necessary).
    

A special chunk identifier of `LIST` may be used to nest chunks within an **L1** chunk. These `LIST` chunks mimic the structure of **L0** `RIFF` chunks:

*   Bytes 0-3: Chunk identifier, always `LIST`.
    
*   Bytes 4-7: Chunk length (minus 8 bytes for the chunk identifier and chunk length fields).
    
*   Bytes 8-11: List type identifier.
    
*   Bytes 12-n: Chunk data (all **L2** chunks).
    
*   Byte n+1: Padding byte (if necessary).
    

For the purposes of calculating a general box hash, each **L0** chunk shall be treated as a single box with a size of exactly 12 bytes, and a box name equal to the media type identifier (bytes 8-11). Each non-`LIST` **L1** chunk shall be treated as a box with a name equal to the chunk identifier (bytes 0-3) and content extending from the beginning of the chunk identifier (byte 0) to the padding byte, if any, inclusive. Each `LIST` **L1** chunk shall be treated as a box with a name equal to the list type identifier (bytes 8-11) and content extending from the beginning of the chunk identifier (byte 0) to the padding byte, if any, inclusive. All chunks nested within a `LIST` **L1** chunk (**L2** and higher) shall be treated as a part of the `LIST` **L1** chunk’s content and hashed as a single box.

In all cases, padding bytes shall be treated as part of the preceding chunk’s content, and shall be included in the hash for that box.

<a id="_font_specific_handling"></a>
