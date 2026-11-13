---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s540-a-3-6-1-c2pa-manifest-store-embedding
section_title: "A.3.6.1. C2PA Manifest Store embedding"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10905-10928
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.6.1. C2PA Manifest Store embedding

The C2PA Manifest Store shall be embedded as a Sequencer-Specific Meta Event (`FF 7F`) placed immediately before the End of Track event (`FF 2F`) in the designated track chunk:

*   For Format 0 files (single track): the sole `MTrk` chunk.
    
*   For Format 1 files (multi-track): the last `MTrk` chunk.
    
*   For Format 2 files (multiple independent patterns): the first `MTrk` chunk.
    

The data field of the `FF 7F` event shall begin with the 3-byte C2PA extended manufacturer identifier `0x00 0x43 0x32`, immediately followed by the bytes of the C2PA Manifest Store.

> **NOTE:**
> The 3-byte form (`0x00` followed by two bytes) is the correct MIDI mechanism for extended manufacturer identifiers that are not registered as 1-byte values. The bytes `0x43 0x32` are the ASCII characters "C2", chosen to identify C2PA.

Only one `FF 7F` event with the C2PA extended manufacturer identifier (`0x00 0x43 0x32`) shall be present in the file. If more than one such event is encountered, the asset shall be treated as if no manifests were located.

The inserted `FF 7F` event shall use a delta-time of `0x00`. If the End of Track event (`FF 2F`) that previously terminated the designated track had a non-zero delta-time (representing trailing silence or a defined track duration), that delta-time shall be transferred to the `FF 2F` event that follows the inserted manifest event, so that the total duration of the track is unchanged by manifest embedding.

> **NOTE:**
> Non-C2PA-aware MIDI tools commonly reorder, merge, or split tracks. If the `FF 7F` event is displaced from the designated track, the C2PA Manifest Store cannot be located and hard binding validation will fail.

<a id="_locating_the_manifest_store"></a>
