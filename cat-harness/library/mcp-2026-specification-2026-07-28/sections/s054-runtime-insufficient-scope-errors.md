---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s054-runtime-insufficient-scope-errors
section_title: "Runtime Insufficient Scope Errors"
file: "docs/specification/2026-07-28/basic/authorization/index.mdx"
lines: 332-378
source_sha256: 99e7eeaecad53816
granularity: heading
---
#### Runtime Insufficient Scope Errors

When a client makes a request with an access token with insufficient
scope during runtime operations, the server **SHOULD** respond with:

- `HTTP 403 Forbidden` status code (per [RFC 6750 Section 3.1](https://datatracker.ietf.org/doc/html/rfc6750#section-3.1))
- `WWW-Authenticate` header with the `Bearer` scheme and additional parameters:
  - `error="insufficient_scope"` - indicating the specific type of authorization failure
  - `scope="required_scope1 required_scope2"` - specifying the minimum scopes needed for the operation
  - `resource_metadata` - the URI of the Protected Resource Metadata document (for consistency with 401 responses)
  - `error_description` (optional) - human-readable description of the error

**Server Scope Management**: When responding with insufficient scope errors, servers
**SHOULD** include the scopes needed to satisfy the current operation in the `scope`
parameter, consistent with
[RFC 6750 Section 3.1](https://datatracker.ietf.org/doc/html/rfc6750#section-3.1).
The `scope` attribute describes the scopes necessary to access
the requested resource — servers are not required to include
the client's previously granted scopes.

Whatever scope-inclusion strategy a server adopts, servers **SHOULD** include all
scopes required for the current operation in a single challenge.
Challenging incrementally (returning one missing scope, then another
on the subsequent retry) forces multiple authorization round-trips
for a single operation and degrades user experience. The required
scopes may be determined dynamically based on the specific request
arguments and context, but once determined, they should be emitted
together.

Servers **SHOULD** be consistent in their scope inclusion strategy to provide predictable behavior for clients.

Servers **SHOULD** consider the user experience impact when determining which scopes to include in the
response, as misconfigured scopes may require frequent user interaction.

Scope accumulation across operations is a client-side responsibility. See the
[Step-Up Authorization Flow](#step-up-authorization-flow) for the scope-union requirement.

Example insufficient scope response:

```http
HTTP/1.1 403 Forbidden
WWW-Authenticate: Bearer error="insufficient_scope",
                         scope="files:write",
                         resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource",
                         error_description="File write permission required for this operation"
```
