---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s052-error-handling
section_title: "Error Handling"
file: "docs/specification/2026-07-28/basic/authorization/index.mdx"
lines: 315-324
source_sha256: 99e7eeaecad53816
granularity: heading
---
## Error Handling

Servers **MUST** return appropriate HTTP status codes for authorization errors:

| Status Code | Description  | Usage                                      |
| ----------- | ------------ | ------------------------------------------ |
| 401         | Unauthorized | Authorization required or token invalid    |
| 403         | Forbidden    | Invalid scopes or insufficient permissions |
| 400         | Bad Request  | Malformed authorization request            |
