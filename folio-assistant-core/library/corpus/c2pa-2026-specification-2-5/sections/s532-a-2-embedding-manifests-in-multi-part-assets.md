---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s532-a-2-embedding-manifests-in-multi-part-assets
section_title: "A.2. Embedding manifests in multi-part assets"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10808-10812
source_sha256: ff401df19d1fde8c
granularity: heading
---
### A.2. Embedding manifests in multi-part assets

When embedding a C2PA Manifest into a multi-part asset ("multi-asset"), there shall be a C2PA Manifest Store embedded into the primary part of the asset (which contains the active manifest), though additional parts may also contain their own C2PA Manifest Stores. The active manifest of the primary part shall contain a [multi-asset hash assertion](#_multi_asset_hash) that describes the location and hash of each part within the asset and should describe the provenance of the whole multi-part asset.

<a id="_embedding_manifests_into_non_bmff_based_assets"></a>
