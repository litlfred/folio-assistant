---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s559-a-3-14-1-c2pa-manifest-store-embedding
section_title: "A.3.14.1. C2PA Manifest Store embedding"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11160-11166
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.14.1. C2PA Manifest Store embedding

The `value` of a `KeyValue` entry in `key_value_metadata` is a Thrift string (i.e., UTF-8 text). The C2PA Manifest Store shall therefore be Base64-encoded (per [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648)) and embedded as the `value` of a `KeyValue` entry in the `key_value_metadata` list of the footer’s `FileMetaData`, using a `key` of `c2pa:manifest`.

Only one `KeyValue` entry with a `key` of `c2pa:manifest` shall be present per file. If more than one such entry is encountered, the asset shall be treated as if no manifests were located.

<a id="_data_hash_binding_3"></a>
