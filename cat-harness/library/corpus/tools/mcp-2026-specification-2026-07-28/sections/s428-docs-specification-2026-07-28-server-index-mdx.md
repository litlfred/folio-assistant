---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s428-docs-specification-2026-07-28-server-index-mdx
section_title: "docs/specification/2026-07-28/server/index.mdx"
file: "docs/specification/2026-07-28/server/index.mdx"
lines: 1-41
source_sha256: 9c34c72960816e61
granularity: file
---
```text
---
title: Overview
---

Servers provide the fundamental building blocks for adding context to language models via
MCP. These primitives enable rich interactions between clients, servers, and language
models:

- **Prompts**: Pre-defined templates or instructions that guide language model
  interactions
- **Resources**: Structured data or content that provides additional context to the model
- **Tools**: Executable functions that allow models to perform actions or retrieve
  information

Each primitive can be summarized in the following control hierarchy:

| Primitive | Control                | Description                                        | Example                         |
| --------- | ---------------------- | -------------------------------------------------- | ------------------------------- |
| Prompts   | User-controlled        | Interactive templates invoked by user choice       | Slash commands, menu options    |
| Resources | Application-controlled | Contextual data attached and managed by the client | File contents, git history      |
| Tools     | Model-controlled       | Functions exposed to the LLM to take actions       | API POST requests, file writing |

Explore these key primitives in more detail below:

<CardGroup cols={3}>
  <Card
    title="Prompts"
    icon="message"
    href="/specification/2026-07-28/server/prompts"
  />
  <Card
    title="Resources"
    icon="file-lines"
    href="/specification/2026-07-28/server/resources"
  />
  <Card
    title="Tools"
    icon="wrench"
    href="/specification/2026-07-28/server/tools"
  />
</CardGroup>
```
