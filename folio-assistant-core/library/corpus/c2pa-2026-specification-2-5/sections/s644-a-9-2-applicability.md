---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s644-a-9-2-applicability
section_title: "A.9.2. Applicability"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12272-12292
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.9.2. Applicability

The structured text embedding method is applicable to any file with a media type of `text/*` that is not already covered by a format-specific embedding section in this specification. It also applies to formats whose media type is not `text/*` but whose content is plain text with a defined comment syntax (e.g., Postscript, YAML, etc.)

The following `text/*` subtypes are excluded because they have their own embedding methods:

*   `text/html` — see [Section A.7, “Embedding Manifests into HTML”](#embedding_manifests_into_html)
    

XML-based formats (`text/xml`, `application/xml`, `*+xml` and other XML-derived types) that do not have a format-specific embedding section (e.g., MathML, etc.) may use the structured text method with XML comment syntax (`\<!-- -→`). The following XML-based media types are excluded because they have their own embedding methods:

*   `image/svg+xml` — see [Section A.3.3, “Embedding manifests into SVG”](#_embedding_manifests_into_svg)
    
*   `application/ttml+xml` — see [Section A.3.4, “Embedding manifests into TTML”](#_embedding_manifests_into_ttml)
    

The structured text method shall not be used for binary formats or formats without either a comment syntax or front matter convention (e.g., `text/csv`). Such formats are not candidates for this embedding method.

Files that are written only by appending complete lines to the end of the file, and whose earlier bytes are never rewritten — application logs, event logs and JSONL streams — shall not use this method. Such files are instead covered by [Section A.3.17, “Embedding manifests into append-only text files”](#_embedding_manifests_into_append_only_text_files), which delimits its sentinel lines with `-----BEGIN C2PA CHECKPOINT-----` and `-----END C2PA CHECKPOINT-----`.

<a id="_guidance_for_json_based_formats"></a>
