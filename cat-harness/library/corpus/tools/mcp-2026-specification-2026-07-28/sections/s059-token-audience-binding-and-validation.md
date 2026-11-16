---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s059-token-audience-binding-and-validation
section_title: "Token Audience Binding and Validation"
file: "docs/specification/2026-07-28/basic/authorization/security-considerations.mdx"
lines: 14-24
source_sha256: 9b62204a9ff17eb1
granularity: heading
---
## Token Audience Binding and Validation

[RFC 8707](https://www.rfc-editor.org/rfc/rfc8707.html) Resource Indicators provide critical security benefits by binding tokens to their intended
audiences **when the Authorization Server supports the capability**. To enable current and future adoption:

- MCP clients **MUST** include the `resource` parameter in authorization and token requests as specified in the [Resource Parameter Implementation](/specification/2026-07-28/basic/authorization#resource-parameter-implementation) section
- MCP servers **MUST** validate that tokens presented to them were specifically issued for their use

The [Security Best Practices document](/docs/2026-07-28/tutorials/security/security_best_practices#token-passthrough)
outlines why token audience validation is crucial and why token passthrough is explicitly forbidden.
