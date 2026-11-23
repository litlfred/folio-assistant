---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s540-what-it-does
section_title: "What it does?"
file: "scripts/retry-tracker.md"
lines: 12-21
source_sha256: acf5557f96deb122
granularity: heading
---
## What it does?

The retry-tracker script is used to retry failed commits to the OpenURLTracker in DSpace. The OpenURLTracker is used to
track requests made to external systems, such as DOI lookup services, and store metadata about those requests in the
DSpace database.

Also note
that this script is useful
in [exchanging usage statistics information with IRUS](https://wiki.lyrasis.org/display/DSDOC7x/Exchange+usage+statistics+with+IRUS).
