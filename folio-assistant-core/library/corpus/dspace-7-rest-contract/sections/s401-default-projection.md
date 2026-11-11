---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s401-default-projection
section_title: "Default Projection"
file: "projections.md"
lines: 16-23
source_sha256: afe6086479eebe16
granularity: heading
---
### Default Projection

The _default_ projection makes no changes to the normal representation of the resource and **excludes all
subresource embeds**, omitting altogether the `_embedded` section of the HAL representation.

This is the implicit projection for all individual resource endpoints, such as `/api/core/items/<:uuid>`,
if no projection is specified.
