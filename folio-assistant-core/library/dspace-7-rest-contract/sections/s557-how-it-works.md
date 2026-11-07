---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s557-how-it-works
section_title: "How it Works?"
file: "scripts/subscription-send.md"
lines: 28-38
source_sha256: 51e5a59812def9d4
granularity: heading
---
## How it Works?

The subscription-send script runs periodically (e.g., daily) on the DSpace server,
and sends email notifications to users
who have subscribed to specific communities, collections, or items.
The script queries the DSpace database to identify
users who have subscribed to specific items, and then generates an email notification for each subscription.

The script's frequency parameter specifies how often email notifications should be sent. For example, if the frequency
is set to "W" (week), email notifications will be sent once per week to users who have subscribed to items.
