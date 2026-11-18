---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s536-how-it-works
section_title: "How it Works?"
file: "scripts/process-cleaner.md"
lines: 26-32
source_sha256: b23ab26f55b7944d
granularity: heading
---
## How it Works?

The process-cleaner script queries the DSpace database to identify processes in the specified state (RUNNING, FAILED, or
COMPLETED). It then removes those processes from the database. By default, the process-cleaner script deletes all
processes in the COMPLETED state. The `-r` and `-f` options can be used to delete processes in the RUNNING and FAILED
states, respectively.
