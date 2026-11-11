---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s531-conclusion-quickguide
section_title: "Conclusion/QuickGuide"
file: "scripts/orcid-bulk-push.md"
lines: 46-52
source_sha256: 1bcd084bcd97642b
granularity: heading
---
## Conclusion/QuickGuide

In conclusion, the ORCID-bulk-push script is a useful tool for performing a bulk synchronization of all the ORCID
entities in the queue. By synchronizing these entities, you can ensure that the data in DSpace is up-to-date with ORCID.
If you encounter synchronization failures, the script will automatically retry the synchronization up to a maximum
number of attempts. If you want to ensure that all the entities in the queue are synchronized, even if there have been
synchronization failures in the past, you can use the `-f` option to force the synchronization.
