---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s561-a-3-14-3-writing-a-manifest-store
section_title: "A.3.14.3. Writing a Manifest Store"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11175-11195
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.14.3. Writing a Manifest Store

To embed a C2PA Manifest Store:

1.  Reserve a `c2pa:manifest` `KeyValue` entry in `key_value_metadata`, sized to hold the placeholder, Base64-encoded C2PA Manifest Store.
    
2.  Serialize the footer and compute the data hash over the complete file with the placeholder region excluded.
    
3.  Sign the manifest using the computed data hash.
    
4.  Replace the placeholder value with the Base64-encoded, signed manifest, keeping the same encoded byte length, and rewrite the footer.
    
    > **NOTE:**
    > Because the encoded byte length of the value is unchanged, the serialized footer’s total byte length is also unchanged, so the footer length field written in step 2 remains valid and does not need to be modified.
    

This follows the standard C2PA Manifest embeddable flow.

Since Parquet footers are typically rewritten wholesale by Parquet libraries rather than patched in place, claim generators should verify that their Parquet writer preserves the reserved `key_value_metadata` entry’s byte length exactly when replacing the placeholder value, as well as preserving the exact order of `key_value_metadata` entries.

<a id="_embedding_manifests_into_onnx"></a>
