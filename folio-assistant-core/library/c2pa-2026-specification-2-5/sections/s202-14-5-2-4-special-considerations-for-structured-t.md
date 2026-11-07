---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s202-14-5-2-4-special-considerations-for-structured-t
section_title: "14.5.2.4. Special Considerations for Structured Text"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2667-2680
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.5.2.4. Special Considerations for Structured Text

For assets consisting of structured text, the C2PA Manifest Store shall be located by following the procedure defined in [Section A.9, “Embedding Manifests into Structured Text”](#embedding_manifests_into_structured_text). The validator shall read the file in binary mode and search for the `-----BEGIN C2PA MANIFEST-----` and `-----END C2PA MANIFEST-----` delimiters. If the delimiters are not found, only one delimiter is found, or more than one manifest block is found, the asset shall be treated as if no manifests were located.

If a manifest block is found, the validator shall extract the manifest reference between the delimiters. The validator shall trim leading and trailing whitespace (U+0020, U+0009, U+000A, U+000D) from the extracted reference before further processing. The trimmed reference shall be resolved as follows:

1.  If the manifest reference is a `data:` URI, verify that the media type is `application/c2pa` and the encoding is `base64`. If valid, decode the Base64 data to obtain the C2PA Manifest Store. Otherwise, treat the asset as if no manifests were located.
    
2.  If the manifest reference is a URI, resolve it following the procedure defined in [Section 14.5.3, “By Reference or URI”](#manifests-by-reference). Retrieval of external manifest stores is optional; if the validator does not retrieve the manifest store, the asset shall be treated as if no manifests were located.
    
3.  Otherwise, treat the asset as if no manifests were located.
    

<a id="_locating_append_only_text"></a>
