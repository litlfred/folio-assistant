---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s567-a-3-16-1-c2pa-manifest-store-embedding
section_title: "A.3.16.1. C2PA Manifest Store embedding"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11237-11243
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.16.1. C2PA Manifest Store embedding

The C2PA Manifest Store shall be Base64-encoded (per [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648)) and stored as the value of a `c2pa:manifest` key within the `__metadata__` object of the SafeTensors JSON header.

Only one `c2pa:manifest` key shall be present in the `__metadata__` object. If more than one is encountered, the asset shall be treated as if no manifests were located.

<a id="_data_hash_binding_5"></a>
