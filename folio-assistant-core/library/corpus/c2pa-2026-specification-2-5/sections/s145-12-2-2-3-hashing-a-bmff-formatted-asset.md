---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s145-12-2-2-3-hashing-a-bmff-formatted-asset
section_title: "12.2.2.3. Hashing a BMFF-formatted asset"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1898-1908
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 12.2.2.3. Hashing a BMFF-formatted asset

If the asset is based on [ISO/IEC 14496-12, ISO BMFF](https://www.iso.org/standard/83102.html) then a hard binding optimized for the box-based format (called [BMFF-based hash assertions](#_bmff_based_hash)) may be used instead.

For a monolithic MP4 file asset where the `mdat` box is validated as a unit, the assertion is validated nearly identically to a data hash assertion. It simply uses a box exclusion list instead of byte ranges to define the range of bytes that are hashed (and those that are not).

For fragmented MP4 (fMP4) files, the assertion itself shall be combined with chunk-specific hashing information which is located as specified in [Section A.5, “Embedding manifests into BMFF-based assets”](#_embedding_manifests_into_bmff_based_assets).

The details on how to hash individual segments for live media can be found [here](#live-media).

<a id="_hashing_unstructured_text_assets"></a>
