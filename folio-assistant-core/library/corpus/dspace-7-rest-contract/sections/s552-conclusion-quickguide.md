---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s552-conclusion-quickguide
section_title: "Conclusion/QuickGuide:"
file: "scripts/solr-database-resync.md"
lines: 46-51
source_sha256: 4e77ec92d09cbff3
granularity: heading
---
## Conclusion/QuickGuide:

The solr-database-resync script is a powerful tool for ensuring that the database and Solr index are in sync. However,
it should be used with caution and only when necessary as it can modify the database status of a large number of items.
It is recommended to back up your database before running this script in case any issues arise. If you encounter issues
with search results or item statuses, this script may be a helpful tool to help diagnose and resolve the issue.
