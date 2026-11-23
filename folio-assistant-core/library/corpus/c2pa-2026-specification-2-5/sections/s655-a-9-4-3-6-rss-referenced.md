---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s655-a-9-4-3-6-rss-referenced
section_title: "A.9.4.3.6. RSS (Referenced)"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12449-12464
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### A.9.4.3.6. RSS (Referenced)

For RSS 2.0 feeds, as defined in the [RSS 2.0 Specification](https://rssboard.org/rss-specification), the manifest block is embedded as an XML comment placed immediately after the XML declaration and before the root `rss` element.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- -----BEGIN C2PA MANIFEST----- https://fabrikam.com/manifests/a1b2c3.c2pa -----END C2PA MANIFEST----- -->
<rss version="2.0">
  <channel>
    <title>Example Feed</title>
    ...
  </channel>
</rss>
```

<a id="_atom_referenced"></a>
