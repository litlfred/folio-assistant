---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s633-a-8-4-1-placement-rules
section_title: "A.8.4.1. Placement Rules"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12119-12139
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.8.4.1. Placement Rules

The `C2PATextManifestWrapper` shall be embedded according to the following rules:

1.  The wrapper shall be embedded as a single, contiguous block of variation selectors.
    
2.  The wrapper shall be immediately preceded by a single Zero-Width No-Break Space (U+FEFF), which marks the start of the wrapper for detection (see [Section A.8.4.2, “Detection Algorithm”](#text_manifest_detection_algorithm)). This marker is part of the wrapper for the purpose of content binding, so the `c2pa.hash.data` exclusion range covers the marker together with the variation-selector run.
    
3.  The wrapper should be placed at the end of the visible text content to simplify parsing and exclusion.
    
4.  The wrapper shall not be split across multiple locations in the text.
    
5.  A claim generator should embed at most one `C2PATextManifestWrapper`. A validator that finds more than one valid `C2PATextManifestWrapper` shall treat the asset as if no manifests were located. The `exclusions` field of the `c2pa.hash.data` assertion identifies the byte range of the wrapper (see [Validating a text data hash](#validating_a_text_data_hash)).
    
6.  The wrapper shall follow the rules above to maximize compatibility with parsers and detection tools.
    

> **NOTE:**
> This way, a parser can read and process the entire visible text content first, and once reaching the end of the content, it can look for the `C2PATextManifestWrapper` to handle provenance information.

<a id="text_manifest_detection_algorithm"></a>
