---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s242-capability-priorities
section_title: "Capability Priorities"
file: "docs/specification/2026-07-28/client/sampling.mdx"
lines: 570-578
source_sha256: 32fe2bb69f5a7caa
granularity: heading
---
#### Capability Priorities

Servers express their needs through three normalized priority values (0-1):

- `costPriority`: How important is minimizing costs? Higher values prefer cheaper models.
- `speedPriority`: How important is low latency? Higher values prefer faster models.
- `intelligencePriority`: How important are advanced capabilities? Higher values prefer
  more capable models.
