---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s033-authorization-server-binding
section_title: "Authorization Server Binding"
file: "docs/specification/2026-07-28/basic/authorization/client-registration.mdx"
lines: 181-202
source_sha256: 912365f0c2b85926
granularity: heading
---
## Authorization Server Binding

Clients that use pre-registered credentials, or persist client credentials obtained via Dynamic Client
Registration, **MUST** associate those
credentials with the specific authorization server that issued them,
keyed by the authorization server's `issuer` identifier. When the
authorization server changes (detected via updated
[protected resource metadata](/specification/2026-07-28/basic/authorization/authorization-server-discovery#authorization-server-location)),
clients **MUST NOT** reuse client credentials
from a different authorization server and **MUST** re-register
with the new authorization server.

Pre-registered credentials are inherently specific to a particular
authorization server. If the authorization server indicated by
protected resource metadata no longer matches the one the
credentials were registered with, clients **SHOULD** surface an
error rather than silently attempting to use mismatched credentials.

Client IDs based on Client ID Metadata Documents are portable
across authorization servers, since they are self-hosted HTTPS URLs
resolved by the authorization server on demand. No re-registration
is needed when the authorization server changes.
