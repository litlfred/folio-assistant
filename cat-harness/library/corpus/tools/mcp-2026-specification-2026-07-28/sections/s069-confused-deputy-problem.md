---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s069-confused-deputy-problem
section_title: "Confused Deputy Problem"
file: "docs/specification/2026-07-28/basic/authorization/security-considerations.mdx"
lines: 107-115
source_sha256: 9b62204a9ff17eb1
granularity: heading
---
## Confused Deputy Problem

Attackers can exploit MCP servers acting as intermediaries to third-party APIs, leading to [confused deputy vulnerabilities](/docs/2026-07-28/tutorials/security/security_best_practices#confused-deputy-problem).
By using stolen authorization codes, they can obtain access tokens without user consent.

MCP proxy servers using static client IDs **MUST** obtain user consent for each
[dynamically registered client](/specification/2026-07-28/basic/authorization/client-registration#dynamic-client-registration)
before forwarding to third-party authorization servers (which may require additional consent).
