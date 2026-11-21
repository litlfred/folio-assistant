---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s043-scope-selection-strategy
section_title: "Scope Selection Strategy"
file: "docs/specification/2026-07-28/basic/authorization/index.mdx"
lines: 97-135
source_sha256: 99e7eeaecad53816
granularity: heading
---
## Scope Selection Strategy

MCP servers **SHOULD** include a `scope` parameter in the `WWW-Authenticate` header as defined in
[RFC 6750 Section 3](https://datatracker.ietf.org/doc/html/rfc6750#section-3)
to indicate the scopes required for accessing the resource. This provides clients with immediate
guidance on the appropriate scopes to request during authorization,
following the principle of least privilege and preventing clients from requesting excessive permissions.

The scopes included in the `WWW-Authenticate` challenge **MAY** match `scopes_supported`, be a subset
or superset of it, or an alternative collection that is neither a strict subset nor
superset. Clients **MUST NOT** assume any particular set relationship between the challenged
scope set and `scopes_supported`. Clients **MUST** treat the scopes provided in the
challenge as authoritative for the current operation. These scopes are required to
satisfy the current request. When re-authorizing, clients **SHOULD** include these scopes
alongside any previously granted scopes to avoid losing permissions needed for other operations
(see [Step-Up Authorization Flow](#step-up-authorization-flow)). Servers **SHOULD** strive for
consistency in how they construct scope sets but they are not required to surface every dynamically
issued scope through `scopes_supported`.

Example 401 response with scope guidance:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource",
                         scope="files:read"
```

When implementing authorization flows, MCP clients **SHOULD** follow the principle of least privilege by requesting
only the scopes necessary for their intended operations. During the initial authorization handshake, MCP clients
**SHOULD** follow this priority order for scope selection:

1. **Use `scope` parameter** from the initial `WWW-Authenticate` header in the 401 response, if provided
2. **If `scope` is not available**, use all scopes defined in `scopes_supported` from the Protected Resource Metadata document, omitting the `scope` parameter if `scopes_supported` is undefined.

The `scopes_supported` field is intended to represent the minimal set of scopes necessary
for basic functionality (see [Scope Minimization](/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization)),
with additional scopes requested incrementally through the step-up authorization flow steps
described in the [Scope Challenge Handling](#scope-challenge-handling) section.
