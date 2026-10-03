---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s430-user-interaction-model
section_title: "User Interaction Model"
file: "docs/specification/2026-07-28/server/prompts.mdx"
lines: 21-38
source_sha256: 85e550635bbbbaa9
granularity: heading
---
## User Interaction Model

Prompts are designed to be **user-controlled**, meaning they are exposed from servers to
clients with the intention of the user being able to explicitly select them for use.
This refers to who decides when the prompt is used, not who authors its content. Prompt
content is defined by the server.

Typically, prompts would be triggered through user-initiated commands in the user
interface, which allows users to naturally discover and invoke available prompts.

For example, as slash commands:

![Example of prompt exposed as slash command](/specification/2026-07-28/server/slash-command.png)

However, implementors are free to expose prompts through any interface pattern that suits
their needs&mdash;the protocol itself does not mandate any specific user interaction
model.
