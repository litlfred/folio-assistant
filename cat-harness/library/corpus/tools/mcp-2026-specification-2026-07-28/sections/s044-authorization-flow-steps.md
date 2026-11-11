---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s044-authorization-flow-steps
section_title: "Authorization Flow Steps"
file: "docs/specification/2026-07-28/basic/authorization/index.mdx"
lines: 136-189
source_sha256: 99e7eeaecad53816
granularity: heading
---
## Authorization Flow Steps

The registration step shown in the flow uses one of the mechanisms defined in
[Client Registration](/specification/2026-07-28/basic/authorization/client-registration).

The complete Authorization flow proceeds as follows:

```mermaid
sequenceDiagram
    participant B as User-Agent (Browser)
    participant C as Client
    participant M as MCP Server (Resource Server)
    participant A as Authorization Server

    C->>M: MCP request without token
    M->>C: HTTP 401 Unauthorized with WWW-Authenticate header
    Note over C: Extract resource_metadata URL from WWW-Authenticate

    C->>M: Request Protected Resource Metadata
    M->>C: Return metadata

    Note over C: Parse metadata and extract authorization server(s)<br/>Client determines AS to use

    C->>A: GET Authorization server metadata endpoint
    Note over C,A: Try OAuth 2.0 and OpenID Connect<br/>discovery endpoints in priority order
    A-->>C: Authorization server metadata

    alt Client ID Metadata Documents
        Note over C: Client uses HTTPS URL as client_id
        Note over A: Server detects URL-formatted client_id
        A->>C: Fetch metadata from client_id URL
        C-->>A: JSON metadata document
        Note over A: Validate metadata and redirect_uris
    else Dynamic client registration
        C->>A: POST /register
        A->>C: Client Credentials
    else Pre-registered client
        Note over C: Use existing client_id
    end

    Note over C: Generate PKCE parameters<br/>Include resource parameter<br/>Apply scope selection strategy<br/>Record expected issuer
    C->>B: Open browser with authorization URL + code_challenge + resource
    B->>A: Authorization request with resource parameter
    Note over A: User authorizes
    A->>B: Redirect to callback with authorization code + iss
    B->>C: Authorization code callback
    Note over C: Validate iss against recorded issuer (RFC 9207)
    C->>A: Token request + code_verifier + resource
    A->>C: Access token (+ refresh token)
    C->>M: MCP request with access token
    M-->>C: MCP response
    Note over C,M: MCP communication continues with valid token
```
