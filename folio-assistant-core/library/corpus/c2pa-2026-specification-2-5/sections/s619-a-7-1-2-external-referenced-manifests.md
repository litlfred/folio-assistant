---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s619-a-7-1-2-external-referenced-manifests
section_title: "A.7.1.2. External (referenced) manifests"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11943-11967
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.7.1.2. External (referenced) manifests

When referencing the C2PA Manifest Store, a `link` element with an attribute of `rel="c2pa-manifest"`, placed in the `head` of the HTML document, shall be used to reference an external C2PA Manifest Store via its `href` attribute. The `type="application/c2pa"` attribute should be included but is not required for discovery; the validator shall match on the `rel` attribute alone. The `c2pa-manifest` link relation is registered in the [IANA Link Relations registry](https://www.iana.org/assignments/link-relations/). The external manifest store shall contain a content binding as specified in [Hard Binding](#_hard_binding).

Example 23. Example of a referenced C2PA Manifest Store in HTML

An example of an HTML document referencing an external C2PA Manifest Store (with the actual URI left as a placeholder).

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Example</title>
    <link rel="c2pa-manifest"
          href="https://fabrikam.com/manifest.c2pa"
          type="application/c2pa">
</head>
<body>
    <p>Content here.</p>
</body>
</html>
```

<a id="_hard_binding_2"></a>
