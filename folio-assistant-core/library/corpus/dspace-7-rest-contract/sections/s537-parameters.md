---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s537-parameters
section_title: "Parameters"
file: "scripts/process-cleaner.md"
lines: 33-43
source_sha256: b23ab26f55b7944d
granularity: heading
---
## Parameters

This script has the following parameters:

| Parameter                  | Description                                                                      |
|----------------------------|----------------------------------------------------------------------------------|
| - `-h`, <br/>`--help`      | Print the help message.                                                          |
| - `-r`, <br/>`--running`   | Delete the process with RUNNING status.                                          |
| - `-f`, <br/>`--failed`    | Delete the process with FAILED status.                                           |
| - `-c`, <br/>`--completed` | Delete the process with COMPLETED status (default if no statuses are specified). |
