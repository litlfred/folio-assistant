---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s553-a-3-13-embedding-manifests-into-facti-facta-fact
section_title: "A.3.13. Embedding manifests into .facti/.facta/.factv"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11083-11096
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.3.13. Embedding manifests into .facti/.facta/.factv

The [BlockFact](https://blockfact.io) family of formats (`.facti`, `.facta`, `.factv`) are IANA-registered binary container formats for provenance-verified media. The full format specification is available at [blockfact.io/docs/facti-format-spec](https://github.com/BlockFact/facti-format-spec/blob/main/SPECIFICATION.md).

*   `image/vnd.blockfact.facti` — [https://www.iana.org/assignments/media-types/image/vnd.blockfact.facti](https://www.iana.org/assignments/media-types/image/vnd.blockfact.facti)
    
*   `audio/vnd.blockfact.facta` — [https://www.iana.org/assignments/media-types/audio/vnd.blockfact.facta](https://www.iana.org/assignments/media-types/audio/vnd.blockfact.facta)
    
*   `video/vnd.blockfact.factv` — [https://www.iana.org/assignments/media-types/video/vnd.blockfact.factv](https://www.iana.org/assignments/media-types/video/vnd.blockfact.factv)
    

Each file consists of a fixed header (4-byte magic + 4-byte metadata length), JSON metadata, a media payload, and typed extension blocks. The JSON metadata includes `format_version` (value `2`) and `media_length` fields that enable readers to locate the extension blocks.

<a id="_c2pa_manifest_store_embedding_2"></a>
