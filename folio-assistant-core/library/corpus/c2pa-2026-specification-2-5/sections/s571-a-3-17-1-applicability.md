---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s571-a-3-17-1-applicability
section_title: "A.3.17.1. Applicability"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11270-11288
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.17.1. Applicability

This section applies to files that are written only by appending complete lines to the end of the file, and whose earlier bytes are never rewritten, specifically:

*   Plain-text files with no structural record grammar, such as application logs and event logs (`text/plain`).
    
*   JSON Lines (JSONL) streams, in which each line of the file is an independent JSON value.
    

Formats with a defined record schema that cannot accommodate an additional record, such as `text/csv` and `text/tab-separated-values`, shall not use this method. Such formats shall use an [external manifest](#_external_manifests) covering the complete file.

Structured text documents — source code, configuration files, Markdown, YAML, and similar formats written with comment or front-matter syntax — shall use [Embedding Manifests into Structured Text](#embedding_manifests_into_structured_text) instead, even when their media type is `text/plain`.

A file that carries checkpoints under this section shall not also carry a structured text manifest block as defined in [Section A.9, “Embedding Manifests into Structured Text”](#embedding_manifests_into_structured_text).

> **NOTE:**
> The two methods are distinguished by the delimiters on the sentinel line alone, so a validator can select the correct procedure before retrieving any C2PA Manifest Store. A line delimited by `-----BEGIN C2PA CHECKPOINT-----` is processed under this section; a line delimited by `-----BEGIN C2PA MANIFEST-----` is processed under the structured text section.

<a id="_append_only_sentinel_line"></a>
