---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s203-14-5-2-5-special-considerations-for-append-only-
section_title: "14.5.2.5. Special Considerations for Append-Only Text Files"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2681-2699
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.5.2.5. Special Considerations for Append-Only Text Files

For append-only plain-text files and JSONL streams, the C2PA Manifest Store shall be located by following the procedure defined in [Section A.3.17, “Embedding manifests into append-only text files”](#_embedding_manifests_into_append_only_text_files). The validator shall:

1.  Read the file in binary mode and scan from the end, line by line, for the last complete sentinel line. For plain-text files, this is a line beginning with `-----BEGIN C2PA CHECKPOINT-----` and ending with `-----END C2PA CHECKPOINT-----`; for JSONL files, a line that is a JSON object containing a `c2pa:checkpoint` member.
    
2.  If no such line is found, or if the last candidate line is malformed, the asset shall be treated as if no manifests were located and the validator shall report `manifest.appendOnlyText.noSentinel`.
    
3.  Extract the manifest reference from the sentinel line, trimming leading and trailing whitespace (U+0020, U+0009, U+000A, U+000D), and resolve it as follows:
    
    *   If the manifest reference is a `data:` URI, verify that the media type is `application/c2pa` and the encoding is `base64`. If valid, decode the Base64 data to obtain the C2PA Manifest Store. Otherwise, treat the asset as if no manifests were located and report `manifest.appendOnlyText.noSentinel`.
        
    *   If the manifest reference is a URI, resolve it following the procedure defined in [Section 14.5.3, “By Reference or URI”](#manifests-by-reference). If the C2PA Manifest Store cannot be retrieved, report `manifest.inaccessible`.
        
    

The C2PA Manifest Store located by this procedure is that of the active checkpoint. The remaining checkpoints in the file are located by following the chain, as described in [Section 14.12.6, “Validating a segment hash”](#_validating_a_segment_hash).

<a id="_special_considerations_for_unstructured_text"></a>
