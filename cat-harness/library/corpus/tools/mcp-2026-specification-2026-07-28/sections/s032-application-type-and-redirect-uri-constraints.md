---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s032-application-type-and-redirect-uri-constraints
section_title: "Application Type and Redirect URI Constraints"
file: "docs/specification/2026-07-28/basic/authorization/client-registration.mdx"
lines: 152-180
source_sha256: 912365f0c2b85926
granularity: heading
---
### Application Type and Redirect URI Constraints

When authorization servers support OpenID Connect (OIDC) and
Dynamic Client Registration, they may enforce additional
constraints on redirect URIs based on the `application_type`
parameter as defined in
[OpenID Connect Dynamic Client Registration 1.0](https://openid.net/specs/openid-connect-registration-1_0.html).

MCP clients **MUST** specify an appropriate `application_type`
during Dynamic Client Registration. Omitting it defaults to
`"web"` under OIDC, which can conflict with native-style redirect
URIs; non-OIDC servers safely ignore the parameter.

- **Native applications** (desktop applications, mobile apps,
  CLI tools, and locally-hosted web applications accessed via
  `localhost`) **SHOULD** use `application_type: "native"`
- **Web applications** (remote browser-based applications
  served from a non-local host) **SHOULD** use
  `application_type: "web"`

MCP clients **MUST** be prepared to handle registration
failures due to redirect URI constraints when authorization
servers implement OIDC. When a registration request is rejected,
clients **SHOULD** surface a meaningful error to the user or
developer. Clients **MAY** retry registration with an adjusted
`application_type` or with redirect URIs that conform to the
authorization server's requirements for the given application
type.
