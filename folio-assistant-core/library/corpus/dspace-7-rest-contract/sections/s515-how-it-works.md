---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s515-how-it-works
section_title: "How it Works?"
file: "scripts/metadata-export.md"
lines: 29-36
source_sha256: 5d1134bdf48b609c
granularity: heading
---
## How it Works?

The metadata-export script queries the DSpace database to retrieve metadata for the specified item, collection, or
community. The metadata is then exported to a file in CSV (comma-separated values) format. By default, the exported
metadata only includes fields that are normally edited by users, such as titles, authors, and dates. If the `-a`
or `--all` parameter is used, all metadata fields will be included in the export, including fields that are not normally
changed, such as provenance.
