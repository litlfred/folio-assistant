---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s562-a-3-15-embedding-manifests-into-onnx
section_title: "A.3.15. Embedding manifests into ONNX"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11196-11200
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.3.15. Embedding manifests into ONNX

[ONNX Intermediate Representation Specification, Version 10](https://onnx.ai/onnx/repo-docs/IR.html) is a widely used format for representing trained machine learning models. An ONNX file contains a [Protocol Buffers Encoding Specification](https://protobuf.dev/programming-guides/encoding/)\-encoded `ModelProto` message with a `metadata_props` field — a repeated list of `StringStringEntryProto` key/value pairs used by the ecosystem for framework metadata, optimization hints, and provenance annotations.

<a id="_c2pa_manifest_store_embedding_4"></a>
