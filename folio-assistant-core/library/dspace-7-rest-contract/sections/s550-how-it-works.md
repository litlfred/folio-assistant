---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s550-how-it-works
section_title: "How it Works?"
file: "scripts/solr-database-resync.md"
lines: 26-37
source_sha256: 4e77ec92d09cbff3
granularity: heading
---
## How it Works?

When an item is added to DSpace, its metadata is stored in the database, and an index is created in Solr. The solr index
includes a "status" field, which indicates whether the item is "in archive", "withdrawn", or "discoverable". If changes
are made to the database outside of DSpace, or if there are errors during indexing, the status in the Solr index may
become out of sync with the status in the database.

The solr-database-resync script updates the database status of items in Solr based on the current index state. The
script retrieves all items from the Solr index, along with their status. It then queries the database to retrieve the
current status of each item and updates the status in the database if necessary. Finally, it triggers a reindex of each
item to ensure that the Solr index is updated with the correct status.
