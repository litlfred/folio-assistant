---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s588-optional-parameters
section_title: "Optional Parameters"
file: "statistics-viewevents.md"
lines: 47-56
source_sha256: 4e2de1ed810866ca
granularity: heading
---
### Optional Parameters
- `dsoType`: Limits the search to a specific DSpace Object type. Possible values:
     - `all`
     - `item`
     - `community`
     - `collection`
- `scope`: The UUID of a specific DSpace container (site, community or collection) to which the search has to be limited.
- `configuration`: The name of a Discovery configuration that was used by the search.
- `appliedFilters`: An array of search filters  used to filter the result set. For more information take a look at the [search documentation](search-endpoint.md#matching-dspace-objects-search-results).
