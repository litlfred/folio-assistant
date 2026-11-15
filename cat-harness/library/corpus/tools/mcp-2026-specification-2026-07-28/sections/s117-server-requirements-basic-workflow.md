---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s117-server-requirements-basic-workflow
section_title: "Server Requirements (Basic Workflow)"
file: "docs/specification/2026-07-28/basic/patterns/mrtr.mdx"
lines: 224-248
source_sha256: a8671eb2a0d292c0
granularity: heading
---
#### Server Requirements (Basic Workflow)

1. Servers **MAY** respond to any [supported client request](#supported-requests) with an `InputRequiredResult`.
1. The `InputRequiredResult` **MAY** include an `inputRequests` field.
   - `inputRequests` keys are server assigned identifiers and **MUST** be unique within the scope of the request.
   - `inputRequests` values are request objects that **MUST** be one of [`ElicitRequest`](/specification/2026-07-28/schema#elicitrequest), [`CreateMessageRequest`](/specification/2026-07-28/schema#createmessagerequest), or [`ListRootsRequest`](/specification/2026-07-28/schema#listrootsrequest)

1. The `InputRequiredResult` **MAY** include a `requestState` field. If specified, this field is an opaque string meaningful only to the server. Servers are free to encode the state in any format (e.g. base64-encoded JSON, encrypted JWT, serialized binary).
1. If a client request contains a `requestState` field, servers **MUST** treat `requestState` as an attacker-controlled input. If `requestState` influences authorization, resource access, or business logic, servers **MUST** protect its integrity (e.g. HMAC or AEAD)
   and **MUST** reject state that fails verification. Integrity protection **MAY** be omitted only when tampering can cause nothing worse than request failure.
1. To prevent replay, servers **SHOULD** include the following inside the integrity-protected `requestState` payload and verify each on receipt:
   - the authenticated principal, rejecting state presented by a different principal.
   - a short expiry (TTL), rejecting state presented after it lapses;
   - an identifier for the originating request, e.g. the method name and a digest of its salient parameters, rejecting state presented on a request that does not match.
     <Warning>
       Note that these measures bound the replay window and prevent cross-user
       and cross-request reuse, but do not by themselves guarantee single-use.
       Servers for which a given `requestState` must be consumed at most once
       (e.g., one-time redemptions) **MUST** enforce that invariant server-side.
     </Warning>

1. Servers **MUST** include at least one of `inputRequests` or `requestState` in every `InputRequiredResult` response.
1. Servers **MUST NOT** send an `inputRequests` that the client has not declared support for in its capabilities. For example, if a client does not declare support for `elicitation`, the server **MUST NOT** include any `elicitation/create` requests in the `inputRequests` field.
1. Servers **MUST NOT** assume that clients will fulfill the `inputRequests` or retry the original request. Servers **MAY** choose to return an `InputRequiredResult` on multiple attempts at the same request if they want to repeatedly prompt the user for information until they have what they need to complete the request.
