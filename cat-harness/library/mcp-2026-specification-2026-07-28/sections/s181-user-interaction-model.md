---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s181-user-interaction-model
section_title: "User Interaction Model"
file: "docs/specification/2026-07-28/client/elicitation.mdx"
lines: 17-48
source_sha256: 74351d1081681695
granularity: heading
---
## User Interaction Model

Elicitation in MCP allows servers to implement interactive workflows by enabling user input
requests to occur _nested_ inside other MCP server features.

Implementations are free to expose elicitation through any interface pattern that suits
their needs&mdash;the protocol itself does not mandate any specific user interaction
model.

<Warning>

For trust & safety and security:

- Servers **MUST NOT** use form mode elicitation to request sensitive information such as
  passwords, API keys, access tokens, or payment credentials
- Servers **MUST** use [URL mode](#url-mode-elicitation-requests) for interactions involving
  such sensitive information

"Sensitive information" in this context refers to secrets and credentials that grant access or
authorize transactions. General contact or profile information (such as a name, email address,
or username) is not categorically prohibited; whether to request such data via form mode is at
the discretion of the server and subject to the user's ability to review and decline.

MCP clients **MUST**:

- Provide UI that makes it clear which server is requesting information
- Respect user privacy and provide clear decline and cancel options
- For form mode, allow users to review and modify their responses before sending
- For URL mode, clearly display the target domain/host and gather user consent before navigation to the target URL

</Warning>
