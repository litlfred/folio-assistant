---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s150-12-2-2-8-hashing-assets-with-multiple-parts
section_title: "12.2.2.8. Hashing assets with multiple parts"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1932-1936
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 12.2.2.8. Hashing assets with multiple parts

For file formats that aggregate multiple distinct parts, such as [CIPA Multi-Picture Format (MPF)](https://www.cipa.jp/std/documents/download_e.html?CIPA_DC-007-2025_E) or Android Ultra HDR, where the integrity of each part must be independently verifiable, the [multi-asset hash assertion](#_multi_asset_hash) shall be used alongside the hard binding assertion for the file as a whole, recording a hash for each part. A multi-asset hash assertion modifies how a hard binding is validated but is not itself considered a hard binding.

<a id="asset_metadata_bindings"></a>
