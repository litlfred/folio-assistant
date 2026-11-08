---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s399-projections
section_title: "Projections"
file: "projections.md"
lines: 1-11
source_sha256: afe6086479eebe16
granularity: heading
---
# Projections
[REST Overview Documentation](README.md)

All `GET` requests returning a HAL document support an optional *projection* argument, specifying the name
of an alternative representation of the requested resource.

Projections may add to, modify, or omit information from the default representation of a resource.

When fulfilling a request, the active projection is applied to the primary resource being requested
as well as any embedded resources.
