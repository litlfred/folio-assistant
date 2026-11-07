---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s443-what-it-does
section_title: "What it does?"
file: "scripts/bulk-access-control.md"
lines: 13-18
source_sha256: a25d844d5b00d2d5
granularity: heading
---
## What it does?

This script performs bulk changes to the access conditions of the items and bitstreams. 
The Bulk Access Control Management focus on Access Control rather than resource policies. The goal will be to add / replace access condition for a set of objects from a user friendly interface that will abstract from the complexity/internal rules of DSpace’s resource policies and bundles as much as possible.
It takes the list of object to process via the uuid parameter and the instructions about how to manipulate (replace, append) access conditions at the item and/or bitstream level. You can find more information about [what is an Access Condition?](#what-is-an-access-condition) at the end of the page.
