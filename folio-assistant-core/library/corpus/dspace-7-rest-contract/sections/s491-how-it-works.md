---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s491-how-it-works
section_title: "How it Works?"
file: "scripts/index-discovery.md"
lines: 28-33
source_sha256: d9ab2a7cbc8c2261
granularity: heading
---
## How it Works?

The index-discovery script updates the Discovery Solr search index in DSpace. The script queries the DSpace database to
identify the items, collections, or communities that need to be added, updated, or removed from the index, and then
performs the corresponding operations on the index.
