---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s185-form-mode-elicitation-requests
section_title: "Form Mode Elicitation Requests"
file: "docs/specification/2026-07-28/client/elicitation.mdx"
lines: 104-113
source_sha256: 74351d1081681695
granularity: heading
---
### Form Mode Elicitation Requests

Form mode elicitation allows servers to collect structured data directly through the MCP client.

Form mode elicitation requests **MUST** either specify `mode: "form"` or omit the `mode` field, and include these additional parameters:

| Name              | Type   | Description                                                    |
| ----------------- | ------ | -------------------------------------------------------------- |
| `requestedSchema` | object | A JSON Schema defining the structure of the expected response. |
