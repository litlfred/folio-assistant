---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s184-elicitation-requests
section_title: "Elicitation Requests"
file: "docs/specification/2026-07-28/client/elicitation.mdx"
lines: 85-103
source_sha256: 74351d1081681695
granularity: heading
---
### Elicitation Requests

Servers **MAY** request information from a user during the processing of a client request, by sending an [`InputRequiredResult`](/specification/2026-07-28/basic/patterns/mrtr#inputrequiredresult)
containing an `elicitation/create` request.

All elicitation requests **MUST** include the following parameters:

| Name      | Type   | Options       | Description                                                                            |
| --------- | ------ | ------------- | -------------------------------------------------------------------------------------- |
| `mode`    | string | `form`, `url` | The mode of the elicitation. Optional for form mode (defaults to `"form"` if omitted). |
| `message` | string |               | A human-readable message explaining why the interaction is needed.                     |

The `mode` parameter specifies the type of elicitation:

- `"form"`: In-band structured data collection with optional schema validation. Data is exposed to the client.
- `"url"`: Out-of-band interaction via URL navigation. Data (other than the URL itself) is **not** exposed to the client.

For backwards compatibility, servers **MAY** omit the `mode` field for form mode elicitation requests. Clients **MUST** treat requests without a `mode` field as form mode.
