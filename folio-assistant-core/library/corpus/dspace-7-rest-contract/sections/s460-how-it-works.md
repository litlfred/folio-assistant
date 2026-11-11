---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s460-how-it-works
section_title: "How it works?"
file: "scripts/export.md"
lines: 32-37
source_sha256: 6351728cf9d36a6c
granularity: heading
---
## How it works?

The export script works by querying the DSpace database to identify the item or collection to be exported. Once the item
or collection has been identified, the script creates a Simple Archive Format (SAF) file containing the item's metadata
and bitstreams (if applicable).
