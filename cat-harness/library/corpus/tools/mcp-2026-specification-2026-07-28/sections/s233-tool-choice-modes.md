---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s233-tool-choice-modes
section_title: "Tool Choice Modes"
file: "docs/specification/2026-07-28/client/sampling.mdx"
lines: 472-479
source_sha256: 32fe2bb69f5a7caa
granularity: heading
---
### Tool Choice Modes

`CreateMessageRequest.params.toolChoice` controls the tool use ability of the model:

- `{mode: "auto"}`: Model decides whether to use tools (default)
- `{mode: "required"}`: Model MUST use at least one tool before completing
- `{mode: "none"}`: Model MUST NOT use any tools
