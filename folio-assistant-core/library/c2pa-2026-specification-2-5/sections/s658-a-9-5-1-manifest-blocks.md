---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s658-a-9-5-1-manifest-blocks
section_title: "A.9.5.1. Manifest Blocks"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12484-12524
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.9.5.1. Manifest Blocks

A claim generator embedding a manifest block in a structured text file shall include a [`c2pa.hash.data`](#_data_hash) assertion with a single exclusion range covering the entire manifest block. Files shall be read in binary mode to preserve the exact byte representation of line terminators.

For the **single-line form**, the manifest block is the single comment line containing the delimiters. For the **multi-line form**, the manifest block spans from the `-----BEGIN C2PA MANIFEST-----` line through the `-----END C2PA MANIFEST-----` line, inclusive.

If the manifest block is at the **beginning** of the file:

*   `start`: 0
    
*   `length`: byte length of the manifest block including its trailing line terminator (LF or CRLF)
    

If the manifest block is at the **end** of the file:

*   `start`: byte offset of the newline character preceding the manifest block
    
*   `length`: number of bytes from that offset to end of file
    

If the manifest block appears elsewhere in the file (e.g., after a required header line):

*   `start`: byte offset of the first byte of the manifest block line (including the comment prefix)
    
*   `length`: byte length of the manifest block line including its trailing line terminator (LF or CRLF)
    

If the file contains only the manifest block:

*   `start`: 0
    
*   `length`: byte length of the entire file
    

> **NOTE:**
> When the manifest block appears inside a front matter section, the front matter delimiters (e.g., `---`) are **not** part of the exclusion range. Only the lines from `-----BEGIN C2PA MANIFEST-----` through `-----END C2PA MANIFEST-----` are excluded.

> **IMPORTANT:**
> Line terminators shall be either LF (0x0A) or CRLF (0x0D 0x0A). Files using bare CR (0x0D) line endings — a convention originating from Classic Mac OS (pre-2001) and extinct in modern practice — are not supported by this method because bare CR creates ambiguity in line boundary detection. Such files shall be converted to LF or CRLF before embedding. A claim generator shall not alter the line ending convention of the file content outside the manifest block.

<a id="_validation_behaviour"></a>
