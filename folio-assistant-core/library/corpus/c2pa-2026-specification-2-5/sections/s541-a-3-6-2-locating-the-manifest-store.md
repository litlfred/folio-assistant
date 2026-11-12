---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s541-a-3-6-2-locating-the-manifest-store
section_title: "A.3.6.2. Locating the Manifest Store"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10929-10944
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.6.2. Locating the Manifest Store

A validator shall locate the C2PA Manifest Store in a Standard MIDI File as follows:

1.  Parse the `MThd` chunk to determine the file format (0, 1, or 2) and the total number of track chunks.
    
2.  Identify the designated track chunk: for Format 0, the sole track; for Format 1, the last track; for Format 2, the first track.
    
3.  Scan the events of the designated track sequentially until the End of Track event (`FF 2F`) is reached.
    
4.  If a Sequencer-Specific Meta Event (`FF 7F`) is encountered whose data field begins with the bytes `0x00 0x43 0x32`, the bytes immediately following those three bytes are the C2PA Manifest Store.
    
5.  If no such event is found, the asset shall be treated as if no manifests were located.
    

<a id="_data_hash_binding"></a>
