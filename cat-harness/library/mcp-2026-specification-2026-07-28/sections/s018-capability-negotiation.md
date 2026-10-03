---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s018-capability-negotiation
section_title: "Capability Negotiation"
file: "docs/specification/2026-07-28/architecture/index.mdx"
lines: 116-174
source_sha256: 9037b342a1f23c05
granularity: heading
---
## Capability Negotiation

The Model Context Protocol uses a capability-based negotiation system where clients and
servers declare their supported features on each request. Clients include their
capabilities in `_meta.io.modelcontextprotocol/clientCapabilities` on every request.
Servers advertise their capabilities in response to
[`server/discover`](/specification/2026-07-28/server/discover), which clients may call before
any other request for up-front capability discovery.

- Servers declare capabilities like tool support, resource subscriptions, and prompt
  templates
- Clients declare capabilities like sampling support and elicitation handling
- Both parties must respect declared capabilities throughout the interaction
- Additional capabilities can be negotiated through extensions to the protocol

```mermaid
sequenceDiagram
    participant Host
    participant Client
    participant Server

    opt Discovery
        Client->>Server: server/discover
        Server-->>Client: supported versions + capabilities
    end

    loop Client Requests
        Host->>Client: User- or model-initiated action
        Client->>Server: Request (with _meta: version, clientCapabilities)
        alt Server requires client input
            Server-->>Client: InputRequiredResult (e.g. sampling/createMessage)
            Client->>Host: Forward to AI
            Host-->>Client: AI response
            Client->>Server: Original request (with input)
        end
        Server-->>Client: Response
        Client-->>Host: Update UI or respond to model
    end

    opt Subscriptions
        Client->>Server: subscriptions/listen (toolsListChanged, resourceSubscriptions, …)
        Server--)Client: notifications/subscriptions/acknowledged
        loop Stream
            Server--)Client: notifications/* (tagged with subscriptionId)
        end
    end
```

Each capability unlocks specific protocol features on a per-request basis. For example:

- Implemented [server features](/specification/2026-07-28/server) must be advertised in the
  server's capabilities
- Receiving resource update notifications requires opening a
  [`subscriptions/listen`](/specification/2026-07-28/basic/patterns/subscriptions) stream
  with the desired resource URIs
- [Tool](/specification/2026-07-28/server/tools) invocation requires the server to declare tool capabilities

This capability negotiation ensures clients and servers have a clear understanding of
supported functionality while maintaining protocol extensibility.
