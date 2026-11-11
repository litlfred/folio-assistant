---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s241-model-preferences
section_title: "Model Preferences"
file: "docs/specification/2026-07-28/client/sampling.mdx"
lines: 560-569
source_sha256: 32fe2bb69f5a7caa
granularity: heading
---
### Model Preferences

Model selection in MCP requires careful abstraction since servers and clients may use
different AI providers with distinct model offerings. A server cannot simply request a
specific model by name since the client may not have access to that exact model or may
prefer to use a different provider's equivalent model.

To solve this, MCP implements a preference system that combines abstract capability
priorities with optional model hints:
