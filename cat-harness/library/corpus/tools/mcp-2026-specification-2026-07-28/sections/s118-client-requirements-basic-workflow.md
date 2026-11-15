---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s118-client-requirements-basic-workflow
section_title: "Client Requirements (Basic Workflow)"
file: "docs/specification/2026-07-28/basic/patterns/mrtr.mdx"
lines: 249-258
source_sha256: a8671eb2a0d292c0
granularity: heading
---
#### Client Requirements (Basic Workflow)

1. If a client receives an `InputRequiredResult` that contains the `inputRequests` field, the client **MUST** construct the requested
   inputs before retrying the original request. If the `InputRequiredResult` does _not_ contain the `inputRequests` field,
   the client **MAY** retry the original request immediately.
1. If an `InputRequiredResult` contains the `requestState` field, the client **MUST** echo back the exact value of that field when retrying the original request.
   Clients **MUST NOT** inspect, parse, modify, or make any assumptions about the `requestState` contents. If the `InputRequiredResult` does not contain a `requestState` field, the client **MUST NOT** include one in the retry.
1. The JSON-RPC `id` **MUST** be different between the initial request and the retry, as they are independent requests.
1. Both the `inputRequests` and `requestState` fields affect only the client's retry of the original request. They **MUST NOT** be used for any other request that the client may be sending in parallel.
