---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s190-example-request-sensitive-data
section_title: "Example: Request Sensitive Data"
file: "docs/specification/2026-07-28/client/elicitation.mdx"
lines: 350-384
source_sha256: 74351d1081681695
granularity: heading
---
#### Example: Request Sensitive Data

This example shows a URL mode elicitation request directing the user to a secure URL where they can provide sensitive information (an API key, for example).
The same request could direct the user into an OAuth authorization flow, or a payment flow. The only difference is the URL and the message.

**Input request (delivered inside `InputRequiredResult.inputRequests`):**

```json
{
  "method": "elicitation/create",
  "params": {
    "mode": "url",
    "url": "https://mcp.example.com/ui/set_api_key",
    "message": "Please provide your API key to continue."
  }
}
```

**Client result (returned inside `inputResponses` on the retried request):**

```json
{
  "action": "accept"
}
```

The response with `action: "accept"` indicates that the user has consented to the
interaction. It does not mean that the interaction is complete. The interaction occurs out
of band and the client is not directly informed of the outcome. When the client retries
the original request, the server determines from the echoed `requestState` (or its own
stored state) whether the out-of-band interaction has completed, and either returns the
final result or responds with another `InputRequiredResult`. Clients **SHOULD** provide
manual controls that let the user retry or cancel the original request (or otherwise
resume interacting with the client).
