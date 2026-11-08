---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s478-parameters
section_title: "Parameters:"
file: "scripts/harvest.md"
lines: 39-57
source_sha256: 8ca242498814b0bd
granularity: heading
---
## Parameters:

| Parameter                              | Description                                                                                                        |
|----------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| `-p`, <br/>`--purge`                   | Deletes all items in the collection.                                                                               |
| `-r`, <br/>`--run`                     | Runs the standard harvest procedure.                                                                               |
| `-g`, <br/>`--ping`                    | Tests the OAI server and sets it up for harvesting.                                                                |
| `-s`, <br/>`--setup`                   | Sets the collection up for harvesting.                                                                             |
| `-S`, <br/>`--start`                   | Starts the harvest loop.                                                                                           |
| `-R`, <br/>`--reset`                   | Resets harvest status on all collections.                                                                          |
| `-P`, <br/>`--purgeCollections`        | Purges all harvestable collections.                                                                                |
| `-o`, <br/>`--reimport`                | ReImports all items in the collection. This is equivalent to using `-p` and then `-r`.                             |
| `-c`, <br/>`--collection <value>`      | The harvesting collection (handle or ID).                                                                          |
| `-t`, <br/>`--type <value>`            | The type of harvesting (0 for none).                                                                               |
| `-a`, <br/>`--address <value>`         | The address of the OAI-PMH server.                                                                                 |
| `-i`, <br/>`--oai_set_id <value>`      | The ID of the OAI-PMH set representing the harvested collection.                                                   |
| `-m`, <br/>`--metadata_format <value>` | The name of the desired metadata format for harvesting. This is resolved to namespace and crosswalk in dspace.cfg. |
| `-h`, <br/>`--help`                    | Shows help information.                                                                                            |
