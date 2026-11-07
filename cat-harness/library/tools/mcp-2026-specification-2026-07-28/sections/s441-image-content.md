---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s441-image-content
section_title: "Image Content"
file: "docs/specification/2026-07-28/server/prompts.mdx"
lines: 244-258
source_sha256: 85e550635bbbbaa9
granularity: heading
---
#### Image Content

Image content allows including visual information in messages:

```json
{
  "type": "image",
  "data": "base64-encoded-image-data",
  "mimeType": "image/png"
}
```

The image data **MUST** be base64-encoded and include a valid MIME type. This enables
multi-modal interactions where visual context is important.
