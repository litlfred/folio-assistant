---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s119-error-handling
section_title: "Error Handling"
file: "docs/specification/2026-07-28/basic/patterns/mrtr.mdx"
lines: 259-268
source_sha256: a8671eb2a0d292c0
granularity: heading
---
### Error Handling

Servers **SHOULD** validate that the data provided by the client is a valid `InputResponses` object and that the information inside can be correctly parsed.
Protocol errors (malformed JSON, invalid schema, internal server errors) **SHOULD** return a JSON-RPC error response with an appropriate error code and message.

If additional, unexpected parameters are provided in the `InputResponses` object, the server **SHOULD** ignore any information it does not recognize or need.

If the client fails to send all the information requested in a previous `InputRequests`, and the missing information is necessary for the server to process the request,
the server **SHOULD** respond with a new `InputRequiredResult` requesting the missing information again, rather than returning an error.
