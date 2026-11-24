---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s563-a-3-15-1-c2pa-manifest-store-embedding
section_title: "A.3.15.1. C2PA Manifest Store embedding"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11201-11207
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.15.1. C2PA Manifest Store embedding

The C2PA Manifest Store shall be Base64-encoded (per [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648)) and stored as the `value` of a `StringStringEntryProto` entry in the `ModelProto.metadata_props` list, using a `key` of `c2pa:manifest`.

Only one entry with a `key` of `c2pa:manifest` shall be present per model file. If more than one such entry is encountered, the asset shall be treated as if no manifests were located.

<a id="_data_hash_binding_4"></a>
