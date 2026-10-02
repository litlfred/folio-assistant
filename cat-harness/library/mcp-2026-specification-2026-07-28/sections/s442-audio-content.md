---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s442-audio-content
section_title: "Audio Content"
file: "docs/specification/2026-07-28/server/prompts.mdx"
lines: 259-273
source_sha256: 85e550635bbbbaa9
granularity: heading
---
#### Audio Content

Audio content allows including audio information in messages:

```json
{
  "type": "audio",
  "data": "base64-encoded-audio-data",
  "mimeType": "audio/wav"
}
```

The audio data MUST be base64-encoded and include a valid MIME type. This enables
multi-modal interactions where audio context is important.
