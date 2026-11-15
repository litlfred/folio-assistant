---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s446-how-it-works
section_title: "How it Works?"
file: "scripts/bulk-access-control.md"
lines: 28-32
source_sha256: a25d844d5b00d2d5
granularity: heading
---
## How it Works?

The Bulk Access Control Management script reads a json file containing the details about which resources (items and bitstreams) need to be processed and how to manipulate the access conditions.
The script then processes the items and bitstreams identified according to the defined mode and specified accessConditions.
