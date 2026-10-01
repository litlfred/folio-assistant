---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s199-understanding-the-distinction
section_title: "Understanding the Distinction"
file: "docs/specification/2026-07-28/client/elicitation.mdx"
lines: 505-536
source_sha256: 74351d1081681695
granularity: heading
---
#### Understanding the Distinction

- **MCP Authorization**: Required OAuth flow between the MCP client and MCP server (covered in the [authorization specification](../basic/authorization))
- **External (third-party) Authorization**: Optional authorization between the MCP server and a third-party resource server, initiated via URL mode elicitation

In external authorization, the server acts as both:

- An OAuth resource server (to the MCP client)
- An OAuth client (to the third-party resource server)

Example scenario:

- An MCP client connects to an MCP server
- The MCP server integrates with various different third-party services
- When the MCP client calls a tool that requires access to a third-party service, the MCP server needs credentials for that service

The critical security requirements are:

1. **The third-party credentials MUST NOT transit through the MCP client**: The client must never see third-party credentials to protect the security boundary
2. **The MCP server MUST NOT use the client's credentials for the third-party service**: That would be [token passthrough](/docs/2026-07-28/tutorials/security/security_best_practices#token-passthrough), which is forbidden
3. **The user MUST authorize the MCP server directly**: The interaction happens outside the MCP protocol, without involving the MCP client
4. **The MCP server is responsible for tokens**: The MCP server is responsible for storing and managing the third-party tokens obtained through the URL mode elicitation (in other words, the MCP server must be stateful).

Credentials obtained via URL mode elicitation are distinct from the MCP server credentials used by the MCP client. The MCP server **MUST NOT** transmit credentials obtained through URL mode elicitation to the MCP client.

<Note>
  For additional background, refer to the [token passthrough
  section](/docs/2026-07-28/tutorials/security/security_best_practices#token-passthrough)
  of the Security Best Practices document to understand why MCP servers cannot
  act as pass-through proxies.
</Note>
