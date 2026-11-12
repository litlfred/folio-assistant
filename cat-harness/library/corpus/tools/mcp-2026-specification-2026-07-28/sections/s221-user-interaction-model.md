---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s221-user-interaction-model
section_title: "User Interaction Model"
file: "docs/specification/2026-07-28/client/sampling.mdx"
lines: 26-47
source_sha256: 32fe2bb69f5a7caa
granularity: heading
---
## User Interaction Model

Sampling in MCP allows servers to implement agentic behaviors, by enabling LLM calls to
occur _nested_ inside other MCP server features.

Implementations are free to expose sampling through any interface pattern that suits
their needs&mdash;the protocol itself does not mandate any specific user interaction
model.

<Warning>

For trust & safety and security, there **SHOULD** always
be a human in the loop with the ability to deny sampling requests.

Applications **SHOULD**:

- Provide UI that makes it easy and intuitive to review sampling requests
- Allow users to view and edit prompts before sending
- Present generated responses for review before delivery

</Warning>
