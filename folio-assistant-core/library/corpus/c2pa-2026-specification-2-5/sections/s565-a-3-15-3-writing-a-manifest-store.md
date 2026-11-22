---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s565-a-3-15-3-writing-a-manifest-store
section_title: "A.3.15.3. Writing a Manifest Store"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11213-11231
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.15.3. Writing a Manifest Store

To embed a C2PA Manifest Store, a two-pass approach (as described for JPEG 1 and other formats) shall be used:

1.  Reserve a `c2pa:manifest` entry in `metadata_props`, sized to hold the placeholder, Base64-encoded C2PA Manifest Store.
    
2.  Serialize the `ModelProto` and compute the data hash over the complete file with the placeholder region excluded.
    
3.  Sign the manifest using the computed data hash.
    
4.  Replace the placeholder value with the Base64-encoded, signed manifest, keeping the same encoded byte length, and rewrite the serialized `ModelProto`.
    

Claim generators should ensure the serialized byte offset of the `c2pa:manifest` value is stable between the placeholder and final write passes.

> **NOTE:**
> ONNX files are serialized as Protocol Buffers. Field ordering and varint encoding can vary between serialization libraries.

<a id="_embedding_manifests_into_safetensors"></a>
