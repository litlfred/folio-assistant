---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s402-full-projection-projection-full
section_title: "Full Projection (`?projection=full`)"
file: "projections.md"
lines: 24-30
source_sha256: afe6086479eebe16
granularity: heading
---
### Full Projection (`?projection=full`)

The _full_ projection includes all linked subresources also embedded in the response.

Since embeds may include other embedded resources, it is important to limit the number of embed levels
alloweds. Thus, only two levels of embeds will be returned at maximum when the _full_ projection is requested.
