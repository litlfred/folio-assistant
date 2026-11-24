---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s549-when-we-use-it
section_title: "When we use it?"
file: "scripts/solr-database-resync.md"
lines: 20-25
source_sha256: 4e77ec92d09cbff3
granularity: heading
---
## When we use it?

The script is typically used when there is a mismatch between the database and the Solr index, which can happen if
changes are made to the database outside of DSpace, or if there are errors during indexing. The status in the Solr index
may become out of sync with the status in the database, causing issues with search results.
