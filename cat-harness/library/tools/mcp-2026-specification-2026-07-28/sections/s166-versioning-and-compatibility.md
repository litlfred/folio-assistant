---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s166-versioning-and-compatibility
section_title: "Versioning and Compatibility"
file: "docs/specification/2026-07-28/basic/versioning.mdx"
lines: 1-28
source_sha256: bc02f271700bdecd
granularity: heading
---
---
title: Versioning and Compatibility
---

<div id="enable-section-numbers" />

This page defines how a client and server agree on what they are speaking:
the protocol version, declared on every request; optional extensions,
negotiated through capabilities; and interoperability with earlier,
handshake-based protocol revisions.

There is no negotiation handshake. Every request carries its protocol
version, and the server accepts or rejects each request independently:

```mermaid
sequenceDiagram
    participant Client
    participant Server

    Client->>Server: request (with `_meta`)
    alt server supports requested version
        Server-->>Client: result
    else version unsupported
        Server-->>Client: UnsupportedProtocolVersionError
        Note over Client,Server: Client retries with a mutually supported version
    end
```
