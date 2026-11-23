---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s147-12-2-2-5-hashing-structured-text-assets
section_title: "12.2.2.5. Hashing structured text assets"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1914-1918
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 12.2.2.5. Hashing structured text assets

For structured text assets that have a C2PA Manifest associated using ASCII armour-style delimiters as described in [Section A.9, “Embedding Manifests into Structured Text”](#embedding_manifests_into_structured_text), a [data hash assertion](#_data_hash) shall be used. The exclusion range covers the manifest block so that the hash is computed over the file content without the manifest reference. Details of the hard binding are defined in [Section A.9.5, “Hard Binding”](#structured_text_hard_binding).

<a id="_hashing_append_only_text_assets"></a>
