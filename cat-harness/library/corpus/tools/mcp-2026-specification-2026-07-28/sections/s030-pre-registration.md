---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s030-pre-registration
section_title: "Pre-registration"
file: "docs/specification/2026-07-28/basic/authorization/client-registration.mdx"
lines: 128-137
source_sha256: 912365f0c2b85926
granularity: heading
---
## Pre-registration

MCP clients **SHOULD** support an option for static client credentials such as those supplied by a pre-registration flow. This could be:

1. Hardcode a client ID (and, if applicable, client credentials) specifically for the MCP client to use when
   interacting with that authorization server, or
2. Present a UI to users that allows them to enter these details, after registering an
   OAuth client themselves (e.g., through a configuration interface hosted by the
   server).
