---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s024-client-registration
section_title: "Client Registration"
file: "docs/specification/2026-07-28/basic/authorization/client-registration.mdx"
lines: 1-19
source_sha256: 912365f0c2b85926
granularity: heading
---
---
title: Client Registration
---

<div id="enable-section-numbers" />

MCP supports three client registration mechanisms. Choose based on your scenario:

- **[Client ID Metadata Documents](#client-id-metadata-documents)**: When client and server have no prior relationship (most common)
- **[Pre-registration](#pre-registration)**: When client and server have an existing relationship
- **[Dynamic Client Registration](#dynamic-client-registration)**: For backwards compatibility or specific requirements

Clients supporting all options **SHOULD** use the following priority order:

1. Use pre-registered client information for the server if the client has it available
2. Use Client ID Metadata Documents if the Authorization Server indicates that it supports them (via `client_id_metadata_document_supported` in OAuth Authorization Server Metadata)
3. Use Dynamic Client Registration as a fallback if the Authorization Server supports it (via `registration_endpoint` in OAuth Authorization Server Metadata)
4. Prompt the user to enter the client information if no other option is available
