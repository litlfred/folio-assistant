---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s055-step-up-authorization-flow
section_title: "Step-Up Authorization Flow"
file: "docs/specification/2026-07-28/basic/authorization/index.mdx"
lines: 379-406
source_sha256: 99e7eeaecad53816
granularity: heading
---
#### Step-Up Authorization Flow

Clients will receive scope-related errors during initial authorization or at runtime (`insufficient_scope`).
Clients **SHOULD** respond to these errors by requesting a new access token with an increased set of scopes via a step-up authorization flow or handle the errors in other, appropriate ways.
Clients acting on behalf of a user **SHOULD** attempt the step-up authorization flow. Clients acting on their own behalf (`client_credentials` clients)
**MAY** attempt the step-up authorization flow or abort the request immediately.

The flow is as follows:

1. **Parse error information** from the authorization server response or `WWW-Authenticate` header
2. **Determine required scopes** by computing the union of the
   client's previously requested scope set and the scopes from
   the current challenge. This ensures previously granted
   permissions are preserved when servers emit per-operation
   scope challenges per
   [RFC 6750 Section 3.1](https://datatracker.ietf.org/doc/html/rfc6750#section-3.1).
   Clients **MAY** also consult the
   [Scope Selection Strategy](#scope-selection-strategy) for
   initial scope selection guidance.
3. **Initiate (re-)authorization** with the determined scope set
4. **Retry the original request** with the new authorization no more than a few times and treat this as a permanent authorization failure

Clients **SHOULD** implement retry limits and **SHOULD** track scope upgrade attempts to avoid
repeated failures for the same resource and operation combination.

Servers **MUST** account for scope hierarchies, where a broader scope implies narrower ones, when
deciding whether a token is sufficient for an operation.
