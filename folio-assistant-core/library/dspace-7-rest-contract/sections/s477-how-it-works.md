---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s477-how-it-works
section_title: "How it Works?"
file: "scripts/harvest.md"
lines: 31-38
source_sha256: 8ca242498814b0bd
granularity: heading
---
## How it Works?

The harvest script uses the OAI-PMH protocol to harvest metadata from external collections and import it into DSpace.

When a collection is set up for harvesting, the script establishes a connection with the specified OAI-PMH server and
imports metadata for the specified set ID and metadata format. The harvested metadata is then imported into DSpace, and
items are created or updated as necessary.
