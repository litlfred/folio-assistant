---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s544-a-3-6-5-re-embedding-a-manifest-store
section_title: "A.3.6.5. Re-embedding a Manifest Store"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10973-10991
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.6.5. Re-embedding a Manifest Store

When a new C2PA Manifest Store of a different size is written into a file that already contains one, the existing `FF 7F` event cannot be patched in place — the designated track chunk’s 4-byte length field shall be updated to reflect the new byte layout.

Because the designated track is identified structurally (the sole track for Format 0, the last track for Format 1, or the first track for Format 2) rather than by a fixed file offset, a claim generator shall:

1.  Remove the existing `FF 7F` event carrying the C2PA extended manufacturer identifier from the designated track.
    
2.  Reserve a new `FF 7F` event, sized for the updated manifest, immediately before the `FF 2F` End of Track event, following the same construction rules as initial embedding.
    
3.  Recompute the designated track chunk’s 4-byte length field to reflect the new track chunk byte length.
    
4.  Proceed with the standard two-pass hash/sign/replace flow described above.
    

> **NOTE:**
> Because the exclusion range and all byte offsets are recomputed against the rewritten file on each pass, update manifests do not require the manifest bytes to remain at a fixed file offset. This differs from formats such as TIFF, where offset stability is used to avoid rewriting the entire file.

<a id="_embedding_manifests_into_ogg_vorbis"></a>
