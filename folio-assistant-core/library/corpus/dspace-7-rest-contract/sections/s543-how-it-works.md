---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s543-how-it-works
section_title: "How it Works?"
file: "scripts/retry-tracker.md"
lines: 31-39
source_sha256: acf5557f96deb122
granularity: heading
---
## How it Works?

The retry-tracker script queries the DSpace database to identify URLs that have been marked as failed in the
OpenURLTracker table. It then attempts to resend those failed requests. This can be useful in situations where requests
fail due to temporary network or service issues.

The `-a` option can be used to add a new URL to the OpenURLTracker table for testing purposes. This is useful for
testing the Retry-Tracker script without waiting for a real request to fail.
