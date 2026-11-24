---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s569-a-3-16-3-writing-a-manifest-store
section_title: "A.3.16.3. Writing a Manifest Store"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11249-11264
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.16.3. Writing a Manifest Store

To embed a C2PA Manifest Store, a two-pass approach (as described for JPEG 1 and other formats) shall be used:

1.  Reserve a `c2pa:manifest` key in the `__metadata__` object, sized to hold the placeholder, Base64-encoded C2PA Manifest Store.
    
2.  Serialize the JSON header and compute the data hash over the complete file (header length field + JSON header + tensor data) with the placeholder region excluded.
    
3.  Sign the manifest using the computed data hash.
    
4.  Replace the placeholder value with the Base64-encoded, signed manifest, keeping the same encoded byte length, and rewrite the JSON header. Update the 8-byte header length field if necessary.
    

The JSON header length field should remain consistent with the actual header byte length after manifest insertion. If the Base64-encoded manifest changes the header length, the 8-byte length prefix should be updated accordingly and the exclusion range recalculated.

<a id="_embedding_manifests_into_append_only_text_files"></a>
