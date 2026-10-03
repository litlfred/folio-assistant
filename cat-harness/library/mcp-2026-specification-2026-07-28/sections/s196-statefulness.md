---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s196-statefulness
section_title: "Statefulness"
file: "docs/specification/2026-07-28/client/elicitation.mdx"
lines: 471-485
source_sha256: 74351d1081681695
granularity: heading
---
### Statefulness

Elicitations do not require that the server maintain state about users with the [multi round-trip requests](/specification/2026-07-28/basic/patterns/mrtr#multi-round-trip-requests) mechanism.

However, if state is stored, servers implementing elicitation **MUST** securely associate this state with individual users following the guidelines in the [security best practices](/docs/2026-07-28/tutorials/security/security_best_practices) document. Specifically:

- State storage **MUST** be protected against unauthorized access
- For remote MCP servers, user identification **MUST** be derived from credentials acquired via [MCP authorization](../basic/authorization) when possible (e.g. `sub` claim)

<Note>
  The examples in this section are non-normative and illustrate potential uses
  of elicitation. Implementers should adapt these patterns to their specific
  requirements while maintaining security best practices.
</Note>
