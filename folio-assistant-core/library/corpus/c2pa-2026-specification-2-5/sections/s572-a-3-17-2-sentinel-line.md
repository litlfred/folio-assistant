---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s572-a-3-17-2-sentinel-line
section_title: "A.3.17.2. Sentinel line"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11289-11319
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.17.2. Sentinel line

Each checkpoint shall be represented by exactly one sentinel line, appended immediately after the last line of the segment it covers, as a complete line terminated by the file’s line-ending convention.

The sentinel line shall either reference the C2PA Manifest Store by an external URI or embed it inline as a `data:` URI ([RFC 2397](https://www.rfc-editor.org/rfc/rfc2397)). A claim generator shall use one of the two forms for a given checkpoint, and a validator shall accept both.

For plain-text files, the sentinel line shall be delimited by the fixed ASCII armour-style delimiters `-----BEGIN C2PA CHECKPOINT-----` and `-----END C2PA CHECKPOINT-----`, with the manifest reference appearing between them:

```none
-----BEGIN C2PA CHECKPOINT----- <manifest-reference> -----END C2PA CHECKPOINT-----
```

For JSONL files, where each line is required to be a valid JSON value, the sentinel line shall instead be a complete JSON object on its own line, using a `c2pa:checkpoint` member:

```json
{"c2pa:checkpoint":"<manifest-reference>"}
```

In both forms, `<manifest-reference>` shall be one of:

*   A URI to an externally stored C2PA Manifest Store for this checkpoint.
    
*   A `data:` URI containing the Base64-encoded (per [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648)) complete binary C2PA Manifest Store for this checkpoint, of the form `data:application/c2pa;base64,<Base64>`.
    

> **NOTE:**
> The delimiters follow the same ASCII armour convention as the [structured text method](#embedding_manifests_into_structured_text) but carry a different label, so that a file containing many checkpoints is never mistaken for a structured text document carrying a single manifest block. For the same reason the JSONL member is `c2pa:checkpoint` rather than the `c2pa:manifest` key used by the single-manifest formats in this clause.

A file may contain multiple sentinel lines as it grows. The active checkpoint is the sentinel line with the highest byte offset; earlier sentinel lines are part of the file’s immutable history.

<a id="_append_only_hard_binding"></a>
