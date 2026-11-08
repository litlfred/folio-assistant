---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s529-how-it-works
section_title: "How it Works?"
file: "scripts/orcid-bulk-push.md"
lines: 29-37
source_sha256: 1bcd084bcd97642b
granularity: heading
---
## How it Works?

The ORCID-bulk-push script works by querying the DSpace database to identify all the ORCID entities that are placed in
the ORCID queue. It then attempts to synchronize these entities with ORCID. If an entity fails to synchronize, the
script will retry the synchronization up to a maximum number of attempts. By default, the maximum number of attempts is
set to 10. However, this can be changed in the ORCID configuration file.

If the `-f` option is used, the script will force the synchronization, even if the maximum attempts have been reached.
