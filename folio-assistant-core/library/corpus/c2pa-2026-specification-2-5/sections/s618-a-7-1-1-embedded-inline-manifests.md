---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s618-a-7-1-1-embedded-inline-manifests
section_title: "A.7.1.1. Embedded (inline) manifests"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11915-11942
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.7.1.1. Embedded (inline) manifests

When embedding the C2PA Manifest Store into the HTML document, it shall be embedded as the Base64-encoded (per [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648), Section 4) content of a `script` element with `type="application/c2pa"` placed in the `head` of the HTML document. When performing validation, the validator shall strip leading and trailing whitespace from the `script` element’s text content before Base64 decoding.

> **NOTE:**
> Browsers ignore `script` elements with unrecognized types, and this approach follows the established HTML pattern for embedding structured data (e.g., JSON-LD uses `application/ld+json`).

Example 22. Example of an inline C2PA Manifest Store in HTML

An example of a C2PA Manifest Store embedded inline in an HTML document (with the actual C2PA Manifest’s data left out).

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Example</title>
    <script type="application/c2pa">
        ...Base64 data goes here...
    </script>
</head>
<body>
    <p>Content here.</p>
</body>
</html>
```

<a id="_external_referenced_manifests"></a>
