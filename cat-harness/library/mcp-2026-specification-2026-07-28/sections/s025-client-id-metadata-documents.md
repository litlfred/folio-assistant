---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s025-client-id-metadata-documents
section_title: "Client ID Metadata Documents"
file: "docs/specification/2026-07-28/basic/authorization/client-registration.mdx"
lines: 20-29
source_sha256: 912365f0c2b85926
granularity: heading
---
## Client ID Metadata Documents

MCP clients and authorization servers **SHOULD** support OAuth Client ID Metadata Documents as specified in
[OAuth Client ID Metadata Document](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00)
for client registration.

This approach enables clients to use HTTPS URLs as client identifiers, where the URL points to a JSON document
containing client metadata. This addresses the common MCP scenario where servers and clients have
no pre-existing relationship.
