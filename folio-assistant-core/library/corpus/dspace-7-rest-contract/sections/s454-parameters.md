---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s454-parameters
section_title: "Parameters"
file: "scripts/curate.md"
lines: 38-51
source_sha256: ab4b262fe22e80bb
granularity: heading
---
## Parameters

| Parameter                        | Description                                                                                                                   |
|----------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| `-t`, <br/>`--task <value>`      | The curation task name. Valid options include: `noop`, `profileformats`, `requiredmetadata`, `checklinks`, and `registerdoi`. |
| `-T`, <br/>`--taskfile <value>`  | The file containing curation task names.                                                                                      |
| `-i`, <br/>`--id <value>`        | The ID (handle) of the object to perform the task on, or `all` to perform on the entire repository.                           |
| `-p`, <br/>`--parameter <value>` | A task parameter in the format `NAME=VALUE`.                                                                                  |
| `-q`, <br/>`--queue <value>`     | The name of the task queue to process.                                                                                        |
| `-r`, <br/>`--reporter <value>`  | The relative or absolute path to the desired report file. Use `-` to report to console. If absent, no reporting.              |
| `-s`, <br/>`--scope <value>`     | The transaction scope to impose. Use `object`, `curation`, or `open`. If absent, `open` applies.                              |
| `-v`, <br/>`--verbose`           | Report activity to standard output.                                                                                           |
| `-h`, <br/>`--help`              | Display help information.                                                                                                     |
