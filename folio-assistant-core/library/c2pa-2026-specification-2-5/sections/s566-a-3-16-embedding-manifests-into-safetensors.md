---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s566-a-3-16-embedding-manifests-into-safetensors
section_title: "A.3.16. Embedding manifests into SafeTensors"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11232-11236
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.3.16. Embedding manifests into SafeTensors

[SafeTensors Format Specification](https://huggingface.co/docs/safetensors/index) is a format for storing tensors safely (without arbitrary code execution) and efficiently. A SafeTensors file begins with an 8-byte little-endian unsigned integer specifying the length of a JSON header, followed by the UTF-8 JSON header itself, followed by the raw tensor data. The JSON header contains a `__metadata__` key whose value is an object of arbitrary string key/value pairs.

<a id="_c2pa_manifest_store_embedding_5"></a>
