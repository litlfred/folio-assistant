---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s081-statelessness
section_title: "Statelessness"
file: "docs/specification/2026-07-28/basic/index.mdx"
lines: 182-220
source_sha256: 03586b10e3214c55
granularity: heading
---
## Statelessness

The Model Context Protocol (MCP) is a **stateless protocol**: all the
information needed to process a request is contained in the request itself.
A server processes each request independently; no state should be inferred
from previous requests, even those on the same connection or stream.

Specifically:

- Servers **MUST NOT** rely on prior requests over the same connection to
  establish context (e.g., capabilities, protocol version, client identity).
  Every request supplies this metadata in its [`_meta`](#_meta) field.
- Servers **SHOULD** be prepared to handle requests associated with multiple
  tasks, threads, or conversations.
- Servers **SHOULD NOT** require that a client reuse the same connection or process to
  perform related operations.
- Clients **SHOULD NOT** use an individual task, thread, or conversation as the
  lifetime boundary for the stdio process.
- State that needs to span multiple requests (e.g., long-running tasks,
  application-level handles) **MUST** be referenced by an explicit identifier
  the client passes on each request.

<Note>
  This implies that an open connection, such as a STDIO process, is not a
  conversation or session: clients may interleave unrelated requests on the same
  transport, and a server must not treat connection or process identity as a
  proxy for conversation or session continuity.
</Note>

Long-lived requests like
[`subscriptions/listen`](/specification/2026-07-28/basic/patterns/subscriptions)
remain request/response; the response is just an open stream of notifications.
Their state is scoped to the request itself, not to the connection underneath.

<Info>
  For a walkthrough of how the per-request model maps to SDK code, see the
  [Architecture guide](/docs/2026-07-28/learn/architecture#example).
</Info>
