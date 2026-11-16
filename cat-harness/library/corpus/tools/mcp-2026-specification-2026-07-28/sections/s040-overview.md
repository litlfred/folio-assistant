---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s040-overview
section_title: "Overview"
file: "docs/specification/2026-07-28/basic/authorization/index.mdx"
lines: 60-81
source_sha256: 99e7eeaecad53816
granularity: heading
---
## Overview

1. Authorization servers **MUST** implement OAuth 2.1 with appropriate security
   measures for both confidential and public clients.

2. Authorization servers and MCP clients **SHOULD** support [OAuth Client ID Metadata Documents](/specification/2026-07-28/basic/authorization/client-registration#client-id-metadata-documents)
   ([draft-ietf-oauth-client-id-metadata-document-00](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00)).

3. Authorization servers and MCP clients **MAY** support the OAuth 2.0 Dynamic Client Registration
   Protocol ([RFC7591](https://datatracker.ietf.org/doc/html/rfc7591)). Note that
   [Dynamic Client Registration](/specification/2026-07-28/basic/authorization/client-registration#dynamic-client-registration)
   is deprecated and retained for backwards compatibility with authorization servers that do not support Client ID Metadata Documents.

4. MCP servers **MUST** implement OAuth 2.0 Protected Resource Metadata ([RFC9728](https://datatracker.ietf.org/doc/html/rfc9728)).
   MCP clients **MUST** use OAuth 2.0 Protected Resource Metadata for [authorization server discovery](/specification/2026-07-28/basic/authorization/authorization-server-discovery).

5. MCP authorization servers **MUST** provide at least one of the following discovery mechanisms:
   - OAuth 2.0 Authorization Server Metadata ([RFC8414](https://datatracker.ietf.org/doc/html/rfc8414))
   - [OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html)

   MCP clients **MUST** support both [discovery mechanisms](/specification/2026-07-28/basic/authorization/authorization-server-discovery#authorization-server-metadata-discovery) to obtain the information required to interact with the authorization server.
