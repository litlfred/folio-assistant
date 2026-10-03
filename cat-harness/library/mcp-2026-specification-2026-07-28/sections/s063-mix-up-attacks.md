---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s063-mix-up-attacks
section_title: "Mix-Up Attacks"
file: "docs/specification/2026-07-28/basic/authorization/security-considerations.mdx"
lines: 63-66
source_sha256: 9b62204a9ff17eb1
granularity: heading
---
## Mix-Up Attacks

An attacker that controls one of the authorization servers an MCP client interacts with may attempt to have the client send it an authorization code or token issued by a different, honest authorization server (a mix-up attack, described in [RFC9207 Section 1](https://datatracker.ietf.org/doc/html/rfc9207#section-1)). [Authorization Response Validation](/specification/2026-07-28/basic/authorization#authorization-response-validation) specifies the required mitigation.
