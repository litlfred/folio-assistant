---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s645-a-9-3-guidance-for-json-based-formats
section_title: "A.9.3. Guidance for JSON-Based Formats"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12293-12322
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.9.3. Guidance for JSON-Based Formats

JSON-based formats ([RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)) do not have a general comment syntax or front matter convention, so they are not candidates for the structured text manifest block defined in this section.

Individual JSON-based formats can define their own extension point for associating a C2PA Manifest Store with an asset. For example, a format that permits additional root object members could define a `c2pa_credential` member whose value is a string containing one of:

*   A URI to an external manifest store
    
*   A `data:` URI ([RFC 2397](https://www.rfc-editor.org/rfc/rfc2397)) containing the Base64-encoded C2PA Manifest Store: `data:application/c2pa;base64,<data>`
    

This specification does not reserve or require `c2pa_credential` for all JSON documents. JSON formats with strict schemas that prohibit unknown root-level members can reject such a member. Those formats can use an [external manifest](#_external_manifests) or define a format-specific extension point instead.

```json
{
  "c2pa_credential": "https://fabrikam.com/manifests/a1b2c3.c2pa",
  "title": "Example JSON asset",
  "items": []
}
```

```json
{
  "c2pa_credential": "data:application/c2pa;base64,oWV...truncated...",
  "title": "Example JSON asset",
  "items": []
}
```

<a id="_manifest_block_format"></a>
