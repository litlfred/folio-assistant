---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s204-identifying-the-user
section_title: "Identifying the User"
file: "docs/specification/2026-07-28/client/elicitation.mdx"
lines: 625-634
source_sha256: 74351d1081681695
granularity: heading
---
### Identifying the User

Servers **MUST NOT** rely on client-provided user identification without server verification, as this can be forged.
Instead, servers **SHOULD** follow [security best practices](/docs/2026-07-28/tutorials/security/security_best_practices).

Non-normative examples:

- Incorrect: Treat user input like "I am joe@example.com" as authoritative
- Correct: Rely on [authorization](../basic/authorization) to identify the user
