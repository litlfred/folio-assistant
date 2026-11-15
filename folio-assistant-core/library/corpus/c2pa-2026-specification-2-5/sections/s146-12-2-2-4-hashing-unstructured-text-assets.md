---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s146-12-2-2-4-hashing-unstructured-text-assets
section_title: "12.2.2.4. Hashing unstructured text assets"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1909-1913
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 12.2.2.4. Hashing unstructured text assets

For unstructured text assets that have a C2PA Manifest embedded using Unicode Variation Selectors as described in [Section A.8, “Embedding Manifests into Unstructured Text”](#embedding_manifests_into_unstructured_text), a [data hash assertions](#_data_hash) shall be used. This assertion provides a hard binding mechanism specifically designed for text content where the C2PA Manifest is embedded as a sequence of non-rendering Unicode characters, and its hashing follows the text-specific normalization rules defined in [Validating a text data hash](#validating_a_text_data_hash).

<a id="_hashing_structured_text_assets"></a>
