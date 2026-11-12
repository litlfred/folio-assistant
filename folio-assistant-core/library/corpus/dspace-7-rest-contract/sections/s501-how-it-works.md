---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s501-how-it-works
section_title: "How it Works?"
file: "scripts/metadata-deletion.md"
lines: 24-32
source_sha256: 2727446e9f3af751
granularity: heading
---
## How it Works?

The metadata-deletion script works by querying the DSpace database to identify all items that contain the specified
metadata field, and then deleting all values of that field from each item. This process can take some time depending on
the size of your DSpace repository and the number of items that contain the specified metadata field.

It's important to note that the metadata-deletion script will permanently delete all values of the specified metadata
field from all items in DSpace. This action cannot be undone, so use this script with caution.
