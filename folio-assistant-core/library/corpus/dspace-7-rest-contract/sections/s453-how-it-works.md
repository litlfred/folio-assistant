---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s453-how-it-works
section_title: "How it Works?"
file: "scripts/curate.md"
lines: 29-37
source_sha256: ab4b262fe22e80bb
granularity: heading
---
## How it Works?

The curate script works by running curation tasks on items, collections, or the entire repository. Curation tasks are
specified using the **-t** or **-T** parameter, and can be configured using the **-p** parameter. The **-i** parameter
specifies the object to perform the task on, or "all" to perform the task on the entire repository. Curation tasks are
executed in a transaction scope, which can be specified using the **-s** parameter. The **-q** parameter can be used to
add tasks to a task queue for later processing, while the **-r** parameter can be used to generate a report on the
results of the curation task.
