---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s544-parameters
section_title: "Parameters"
file: "scripts/retry-tracker.md"
lines: 40-49
source_sha256: acf5557f96deb122
granularity: heading
---
## Parameters

The following parameters are available for the Retry-Tracker script:

| Parameter           | Description                                                                                                                                   |
|---------------------|:----------------------------------------------------------------------------------------------------------------------------------------------|
| `-a <value>`        | Add a new "failed" row to the table with a URL (test purposes only).                                                                          |
| `-r`                | Retry sending requests to all URLs stored in the table with failed requests. This includes the URL that can be added through the `-a` option. |
| `-h`, <br/>`--help` | Print the help message.                                                                                                                       |
