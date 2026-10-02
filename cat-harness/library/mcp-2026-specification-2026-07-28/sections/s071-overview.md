---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s071-overview
section_title: "Overview"
file: "docs/specification/2026-07-28/basic/index.mdx"
lines: 1-24
source_sha256: 03586b10e3214c55
granularity: heading
---
---
title: Overview
---

<div id="enable-section-numbers" />

The Model Context Protocol consists of several key components that work together:

- **Base Protocol**: Core JSON-RPC message types
- **Versioning and Compatibility**: Protocol version negotiation, extension negotiation, and interoperability with earlier protocol revisions
- **Message Patterns**: Messaging patterns supported by the core protocol including request and response, multi round-trip requests (MRTR), and subscribe and notify
- **Authorization**: Authentication and authorization framework for HTTP-based transports
- **Server Features**: Resources, prompts, and tools exposed by servers
- **Client Features**: Elicitation, sampling and root directory lists provided by clients
- **Utilities**: Cross-cutting concerns like logging and argument completion

All implementations **MUST** support the base protocol, versioning,
and the message patterns. Other components **MAY** be implemented based on the specific needs of the
application.

These protocol layers establish clear separation of concerns while enabling rich
interactions between clients and servers. The modular design allows implementations to
support exactly the features they need.
