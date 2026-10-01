---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s247-result-fields
section_title: "Result Fields"
file: "docs/specification/2026-07-28/client/sampling.mdx"
lines: 644-661
source_sha256: 32fe2bb69f5a7caa
granularity: heading
---
### Result Fields

Sampling results will contain the following fields:

- `role`: The message role; see [Messages](#messages).
- `content`: The message content. This can be either:
  - A single content block when the response contains only one content block, such as a single text response.
  - An array of content blocks when the response contains one or more content blocks, such as multiple tool uses or mixed content.

  See [Messages](#messages) for content block types.

- `model`: The name of the model that generated the message.
- `stopReason`: The reason why sampling stopped, if known. The specification defines the following (non-exhaustive) stop reasons, although implementations **MAY** provide their own arbitrary values:
  - `"endTurn"`: The participant is yielding the conversation to the other party.
  - `"stopSequence"`: Message generation encountered one of the requested `stopSequences`.
  - `"maxTokens"`: The token limit was reached.
  - `"toolUse"`: The model wants to use one or more tools.
