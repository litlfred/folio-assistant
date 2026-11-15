---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s073-get-a-single-index-configured-as-browse-links-fo
section_title: "Get a single index configured as browse links for the given metadata fields"
file: "browses.md"
lines: 120-134
source_sha256: 847a5e835b2cd033
granularity: heading
---
### Get a single index configured as browse links for the given metadata fields
**/api/discover/browses/search/byFields?fields=<:field>**

Example: <https://{dspace.server.url}/api/discover/browses/search/byFields?fields=dc.contributor.author&fields=dc.creator>

Provide detailed information about a specific browse index and access to the list of items and entries in the index. The JSON response document is as the previous section.

The supported parameters are:
* fields: A metadata field name, eg. dc.contributor.author. This parameter is repeatable.

Error codes:

**204** if none of the fields are configured for browse or browse links
**400** if the fields parameter is missing
