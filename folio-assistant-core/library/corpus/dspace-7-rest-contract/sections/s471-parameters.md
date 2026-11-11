---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s471-parameters
section_title: "Parameters"
file: "scripts/filter-media.md"
lines: 37-49
source_sha256: b719b905c8ad3a71
granularity: heading
---
## Parameters

| Parameter                         | Description                                                                                                                                                                                                   |
|-----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `-v`, <br/>`--verbose`            | Print all extracted text and other details to STDOUT.                                                                                                                                                         |
| `-q`, <br/>`--quiet`              | Do not print anything except in the event of errors.                                                                                                                                                          |
| `-f`, <br/>`--force`              | Force all bitstreams to be processed.                                                                                                                                                                         |
| `-i`, <br/>`--identifier <value>` | ONLY process bitstreams belonging to the specified identifier.                                                                                                                                                |
| `-m`, <br/>`--maximum <value>`    | Process no more than the specified number of items.                                                                                                                                                           |
| `-p`, <br/>`--plugins <value>`    | ONLY run the specified Media Filter plugin(s) listed from 'filter.plugins' in dspace.cfg. Separate multiple plugins with a comma (,) (e.g. MediaFilterManager -p "Word Text Extractor","PDF Text Extractor"). |
| `-s`, <br/>`--skip <value>`       | SKIP the bitstreams belonging to the specified identifier. Separate multiple identifiers with a comma (,) (e.g. MediaFilterManager -s 123456789/34,123456789/323).                                            |
| `-h`, <br/>`--help`               | Display help information for the script.                                                                                                                                                                      |
