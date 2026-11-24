---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s189-url-mode-elicitation-requests
section_title: "URL Mode Elicitation Requests"
file: "docs/specification/2026-07-28/client/elicitation.mdx"
lines: 322-349
source_sha256: 74351d1081681695
granularity: heading
---
### URL Mode Elicitation Requests

<Note>

**New feature:** URL mode elicitation is introduced in the `2025-11-25` version of the MCP specification. Its design and implementation may change in future protocol revisions.

</Note>

URL mode elicitation enables servers to direct users to external URLs for out-of-band interactions that must not pass through the MCP client. This is essential for auth flows, payment processing, and other sensitive or secure operations.

URL mode elicitation requests **MUST** specify `mode: "url"`, a `message`, and include these additional parameters:

| Name  | Type   | Description                               |
| ----- | ------ | ----------------------------------------- |
| `url` | string | The URL that the user should navigate to. |

The `url` parameter **MUST** contain a valid URL.

<Note>
  **Important**: URL mode elicitation is *not* for authorizing the MCP client's
  access to the MCP server (that's handled by [MCP
  authorization](../basic/authorization)). Instead, it's used when the MCP
  server needs to obtain sensitive information or third-party authorization on
  behalf of the user. The MCP client's bearer token remains unchanged. The
  client's only responsibility is to provide the user with context about the
  elicitation URL the server wants them to open.
</Note>
