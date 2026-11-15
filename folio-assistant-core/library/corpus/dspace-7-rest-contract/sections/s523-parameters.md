---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s523-parameters
section_title: "Parameters"
file: "scripts/metadata-import.md"
lines: 35-46
source_sha256: 49867819b601826d
granularity: heading
---
## Parameters

| Parameter           | Description                                                                  |
|---------------------|------------------------------------------------------------------------------|
| `-f <file>`         | Source file. Specifies the CSV file containing the metadata to import.       |
| `-s`                | Silent operation. Doesn't request confirmation of changes. Use with caution. |
| `-w`                | Workflow. When adding new items, use collection workflow.                    |
| `-n`                | Notify. When adding new items using a workflow, send notification emails.    |
| `-v`                | Validate only. Just validate the CSV, don't run the import.                  |
| `-t`                | Template. When adding new items, use the collection template (if it exists). |
| `-h`, <br/>`--help` | Print the help message.                                                      |
