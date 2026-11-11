---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s509-parameters
section_title: "Parameters"
file: "scripts/metadata-export-search.md"
lines: 37-46
source_sha256: 3b5326053db5dcc8
granularity: heading
---
## Parameters

| Parameter                    | Description                                                                                                                                                                                                                                                 |
|------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `-q`, <br/>`--query`         | The discovery search string to be used to match records. Not URL encoded.                                                                                                                                                                                   |
| `-s`, <br/>`--scope`         | UUID of a specific DSpace container (site, community, or collection) to which the search has to be limited.                                                                                                                                                 |
| `-c`, <br/>`--configuration` | The name of a Discovery configuration that should be used by this search.                                                                                                                                                                                   |
| `-f`, <br/>`--filter`        | Advanced search filter that has to be used to filter the result set, with syntax `<:filter-name>,<:filter-operator>=<:filter-value>`. Not URL encoded. For example `author,authority=5df05073-3be7-410d-8166-e254369e4166` or `title,contains=sample text`. |
| `-h`, <br/>`--help`          | Display help information.                                                                                                                                                                                                                                   |
