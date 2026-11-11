---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s656-a-9-4-3-7-atom-referenced
section_title: "A.9.4.3.7. Atom (Referenced)"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12465-12480
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### A.9.4.3.7. Atom (Referenced)

For Atom feeds, as defined in [RFC 4287](https://www.rfc-editor.org/rfc/rfc4287), the manifest block is embedded as an XML comment placed immediately after the XML declaration and before the root `feed` element.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- -----BEGIN C2PA MANIFEST----- https://fabrikam.com/manifests/a1b2c3.c2pa -----END C2PA MANIFEST----- -->
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Example Feed</title>
  ...
</feed>
```

For XML-based formats that begin with an XML declaration (`<?xml …​?>`), the manifest block shall be placed immediately after the XML declaration on a separate line, before the root element. The XML declaration shall be the first line of the file as required by the XML specification.

<a id="structured_text_hard_binding"></a>
