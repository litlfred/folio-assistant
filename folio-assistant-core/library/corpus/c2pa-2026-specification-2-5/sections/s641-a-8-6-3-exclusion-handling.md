---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s641-a-8-6-3-exclusion-handling
section_title: "A.8.6.3. Exclusion Handling"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12239-12250
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.8.6.3. Exclusion Handling

The `exclusions` field in the `c2pa.hash.data` assertion uses byte offsets in the UTF-8 encoded text as stored, before NFC normalization is applied. Normalization is performed on the text that remains after the excluded bytes have been removed, as specified in [Section 14.12.1.3.1, “Validating a text data hash”](#validating_a_text_data_hash). Implementations shall be careful to:

1.  Calculate offsets against the text as stored, not against its normalized form
    
2.  Work with byte offsets, not character offsets
    
3.  Validate that excluded regions encompass the full `C2PATextManifestWrapper`, including the `U+FEFF` marker that precedes it and any trailing padding bytes (see [Section A.8.5, “Deterministic Wrapper Padding”](#deterministic_wrapper_padding))
    

<a id="embedding_manifests_into_structured_text"></a>
