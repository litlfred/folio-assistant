---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s404-specify-embed-requests
section_title: "Specify Embed requests"
file: "projections.md"
lines: 43-54
source_sha256: afe6086479eebe16
granularity: heading
---
## Specify Embed requests

All `GET` requests returning a HAL document support an optional *embed* argument, specifying the link path
of information to be embedded.

Embeds can only add information from the default representation of a resource.

When fulfilling a request, the active embed is applied to the primary resource being requested
as well as any embedded resources.

All linked resources which allow embeds can be retrieved using the *embed* argument, they don't have to be configured
