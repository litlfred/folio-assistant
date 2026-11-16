---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s180-elicitation
section_title: "Elicitation"
file: "docs/specification/2026-07-28/client/elicitation.mdx"
lines: 1-16
source_sha256: 74351d1081681695
granularity: heading
---
---
title: Elicitation
---

<div id="enable-section-numbers" />

The Model Context Protocol (MCP) provides a standardized way for servers to request additional
information from users through the client during interactions. This flow allows clients to
maintain control over user interactions and data sharing while enabling servers to gather
necessary information dynamically.

Elicitation supports two modes:

- **Form mode**: Servers can request structured data from users with optional JSON schemas to validate responses
- **URL mode**: Servers can direct users to external URLs for sensitive interactions that must _not_ pass through the MCP client
