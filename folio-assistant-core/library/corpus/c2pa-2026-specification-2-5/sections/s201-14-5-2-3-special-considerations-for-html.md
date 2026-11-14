---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s201-14-5-2-3-special-considerations-for-html
section_title: "14.5.2.3. Special Considerations for HTML"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2662-2666
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.5.2.3. Special Considerations for HTML

For HTML-based assets, the C2PA Manifest Store shall be located by following the procedure defined in [Section A.7, “Embedding Manifests into HTML”](#embedding_manifests_into_html). If more than one C2PA manifest element is present in the `head` element — more than one `script` element with `type="application/c2pa"`, both a `script` element and a `link` element referencing a C2PA Manifest Store, or otherwise — the asset shall be treated as if no manifests were located.

<a id="_special_considerations_for_structured_text"></a>
