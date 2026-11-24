---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s204-14-5-2-6-special-considerations-for-unstructured
section_title: "14.5.2.6. Special Considerations for Unstructured Text"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2700-2704
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.5.2.6. Special Considerations for Unstructured Text

For assets consisting of unstructured text, the C2PA Manifest Store shall be located by following the procedure defined in [Section A.8, “Embedding Manifests into Unstructured Text”](#embedding_manifests_into_unstructured_text). If no valid `C2PATextManifestWrapper` is found, or more than one valid `C2PATextManifestWrapper` is found, the asset shall be treated as if no manifests were located.

<a id="_special_considerations_for_tiff"></a>
