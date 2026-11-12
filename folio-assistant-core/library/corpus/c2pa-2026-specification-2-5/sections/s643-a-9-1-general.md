---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s643-a-9-1-general
section_title: "A.9.1. General"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12254-12271
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.9.1. General

Structured text formats that support comment syntax — including source code, configuration files (YAML, TOML, INI), markup (Markdown, AsciiDoc, LaTeX), and similar formats — allow human-readable annotations without altering the interpreted content. This section defines a method for associating a C2PA Manifest Store with such formats using a clearly delimited block with fixed ASCII armour-style delimiters (modelled on [RFC 9580, section 6.2](https://www.rfc-editor.org/rfc/rfc9580#section-6.2)). It supports both referencing an external C2PA Manifest Store and embedding the C2PA Manifest Store directly within the file.

Unlike the Unicode Variation Selector method defined in [Section A.8, “Embedding Manifests into Unstructured Text”](#embedding_manifests_into_unstructured_text) for unstructured text, this approach:

*   Preserves human readability of the manifest association (though not the C2PA Manifest Store itself)
    
*   Requires no special Unicode support from editors or renderers
    
*   Works with any format that has a comment or front matter convention
    
*   Uses well-established ASCII Armour delimiters to prevent accidental matches
    

When a format-specific embedding mechanism is available, it should be preferred over this general method. In addition, when structured text is placed inside a container format (e.g., MP4, PDF, ZIP, etc.), the C2PA Manifest Store should be embedded in the container (though they may also be embedded in the structured text as well).

<a id="_applicability_2"></a>
