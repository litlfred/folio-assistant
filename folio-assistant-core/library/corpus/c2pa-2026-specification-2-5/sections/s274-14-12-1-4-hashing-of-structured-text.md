---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s274-14-12-1-4-hashing-of-structured-text
section_title: "14.12.1.4. Hashing of Structured Text"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3833-3840
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.12.1.4. Hashing of Structured Text

For structured text assets, the data hash shall be computed over the raw bytes of the file with the manifest block excluded via the exclusion range in the data hash assertion. The validator shall follow the general data hash validation procedure defined in [Section 12.2.2, “Hard Bindings”](#_hard_bindings).

> **NOTE:**
> Structured text hashing operates on the raw bytes of the file without Unicode normalization. Structured text files are byte-stable on disk, unlike clipboard-portable unstructured text. Applying NFC normalization would create false hash mismatches for files containing legitimate NFD content (e.g., filenames or identifiers in YAML or source code). The byte boundaries of the manifest block are determined by the ASCII delimiters, making exclusion range computation unambiguous.

<a id="_hashing_of_onnx_files"></a>
