---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s251-deprecated
section_title: "Deprecated"
file: "docs/specification/2026-07-28/deprecated.mdx"
lines: 22-36
source_sha256: 6ec5fc903d1be37e
granularity: heading
---
## Deprecated

| Feature                                                                                                                      | Deprecation SEP                                                                    | Deprecated in | Migration path                                                                                                                 | Earliest removal                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| [Roots](/specification/2026-07-28/client/roots)                                                                              | [SEP-2577](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2577) | `2026-07-28`  | Pass directories or files via tool parameters, resource URIs, or server configuration                                          | First revision released on or after 2027-07-28                                                        |
| [Sampling](/specification/2026-07-28/client/sampling)                                                                        | [SEP-2577](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2577) | `2026-07-28`  | Integrate directly with LLM provider APIs                                                                                      | First revision released on or after 2027-07-28                                                        |
| [Logging](/specification/2026-07-28/server/utilities/logging)                                                                | [SEP-2577](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2577) | `2026-07-28`  | Log to `stderr` for stdio transports; use [OpenTelemetry](https://opentelemetry.io/) for observability                         | First revision released on or after 2027-07-28                                                        |
| [Dynamic Client Registration](/specification/2026-07-28/basic/authorization/client-registration#dynamic-client-registration) | [PR #2858](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2858) | `2026-07-28`  | [Client ID Metadata Documents](/specification/2026-07-28/basic/authorization/client-registration#client-id-metadata-documents) | First revision released on or after 2027-07-28                                                        |
| `includeContext: "thisServer"` / `"allServers"` ([Sampling](/specification/2026-07-28/client/sampling#capabilities))         | [SEP-2596](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2596) | `2025-11-25`  | Omit the field or use `"none"`                                                                                                 | Follows Sampling ([SEP-2577](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2577)) |
| [HTTP+SSE transport](/specification/2024-11-05/basic/transports#http-with-sse)                                               | [SEP-2596](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2596) | `2025-03-26`  | [Streamable HTTP](/specification/2026-07-28/basic/transports/streamable-http)                                                  | Three months after SEP-2596 reaches Final                                                             |

The HTTP+SSE transport and the `includeContext` values were already described
as deprecated before the lifecycle policy existed; SEP-2596 reclassifies them
as Deprecated under its [transition provisions](/community/feature-lifecycle).
