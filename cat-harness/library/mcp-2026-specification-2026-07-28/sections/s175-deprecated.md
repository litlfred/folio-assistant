---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s175-deprecated
section_title: "Deprecated"
file: "docs/specification/2026-07-28/changelog.mdx"
lines: 69-100
source_sha256: b327e576f4c96b34
granularity: heading
---
## Deprecated

Features listed here remain part of the specification but are scheduled for removal under the [feature lifecycle and deprecation policy](/community/feature-lifecycle). New implementations should not adopt them. The [deprecated features registry](/specification/2026-07-28/deprecated) tracks every feature currently in the Deprecated state.

1. Deprecate the Roots, Sampling, and Logging features
   ([SEP-2577](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2577)).
   These features remain fully functional during the deprecation window but new
   implementations should not add support for them. Suggested migrations: pass
   directories or files via tool parameters, resource URIs, or server
   configuration instead of Roots; integrate directly with LLM provider APIs
   instead of Sampling; log to `stderr` (stdio) or use OpenTelemetry instead of
   Logging.

2. Reclassify the HTTP+SSE transport (deprecated since protocol version
   `2025-03-26`) as Deprecated under the feature lifecycle policy
   ([SEP-2596](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2596)).
   Migrate to [Streamable HTTP](/specification/2026-07-28/basic/transports/streamable-http).

3. Reclassify the `includeContext` values `"thisServer"` and `"allServers"`
   (soft-deprecated since protocol version `2025-11-25`) as Deprecated
   ([SEP-2596](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2596)).
   Omit the field or use `"none"`; these values will be removed no later than
   the Sampling feature itself.

4. Deprecate the OAuth 2.0 Dynamic Client Registration Protocol
   ([RFC7591](https://datatracker.ietf.org/doc/html/rfc7591)) as a client registration
   mechanism in favor of
   [Client ID Metadata Documents](/specification/2026-07-28/basic/authorization/client-registration#client-id-metadata-documents)
   ([PR #2858](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2858)).
   It remains available for backwards compatibility with authorization servers that do
   not support Client ID Metadata Documents.
