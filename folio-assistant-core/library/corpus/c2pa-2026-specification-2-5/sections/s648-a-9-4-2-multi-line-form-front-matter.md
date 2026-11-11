---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s648-a-9-4-2-multi-line-form-front-matter
section_title: "A.9.4.2. Multi-Line Form (Front Matter)"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12372-12389
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.9.4.2. Multi-Line Form (Front Matter)

Formats that support front matter blocks — such as CommonMark (YAML front matter), TOML front matter (`+`), and similar conventions — use a multi-line manifest block within the front matter when the file has one. Front matter is more reliably preserved by format-specific toolchains than comments.

```yaml
---
-----BEGIN C2PA MANIFEST-----
<manifest-reference>
-----END C2PA MANIFEST-----
---
```

The delimiters shall each appear on their own line within the front matter. The `<manifest-reference>` appears on the line between them and follows the same rules as the [single-line form (URL or `data:` URI)](#single-line-form).

> **NOTE:**
> The front matter delimiters (e.g., `---` for YAML) are part of the host format and not part of the C2PA manifest block. The C2PA delimiters are always `-----BEGIN C2PA MANIFEST-----` and `-----END C2PA MANIFEST-----` regardless of the host format.

<a id="_examples_3"></a>
