---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s275-14-12-1-5-hashing-of-onnx-files
section_title: "14.12.1.5. Hashing of ONNX files"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3841-3849
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.12.1.5. Hashing of ONNX files

For ONNX files, the data hash shall be computed over the raw bytes of the serialized `ModelProto` with the Base64-encoded `c2pa:manifest` value bytes excluded via the exclusion range in the data hash assertion. The validator shall follow the general data hash validation procedure defined in [Section 12.2.2, “Hard Bindings”](#_hard_bindings).

A validator shall verify that exactly one `StringStringEntryProto` entry with a `key` of `c2pa:manifest` exists in the `ModelProto.metadata_props` list. If more than one such entry is encountered, the asset shall be treated as if no manifests were located.

The validator shall verify that the exclusion range corresponds to the byte offset and length of the Base64-encoded manifest value within the serialized file.

<a id="_hashing_of_safetensors_files"></a>
