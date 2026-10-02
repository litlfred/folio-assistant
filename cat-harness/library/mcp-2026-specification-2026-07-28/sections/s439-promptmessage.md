---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s439-promptmessage
section_title: "PromptMessage"
file: "docs/specification/2026-07-28/server/prompts.mdx"
lines: 218-230
source_sha256: 85e550635bbbbaa9
granularity: heading
---
### PromptMessage

Messages in a prompt can contain:

- `role`: Either "user" or "assistant" to indicate the speaker
- `content`: One of the following content types:

<Note>
  All content types in prompt messages support optional
  [annotations](/specification/2026-07-28/server/resources#annotations) for
  metadata about audience, priority, and modification times.
</Note>
