---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s485-parameters
section_title: "Parameters"
file: "scripts/import.md"
lines: 38-64
source_sha256: f2bbbb9de0e4e572
granularity: heading
---
## Parameters

The script takes the following parameters:

| Parameter                        | Description                                                                                                                                                                            |
|----------------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `-a`, <br>`--add`                | This parameter specifies that items in the SAF should be added to DSpace.                                                                                                              |
| `-r`, <br>`--replace`            | This parameter specifies that items in the SAF should replace items in the mapfile in DSpace.                                                                                          |
| `-d`, <br>`--delete`             | This parameter specifies that items listed in the mapfile should be deleted from DSpace.                                                                                               |
| `-z`, <br>`--zip`                | This parameter specifies the name of the zip file containing the SAF.                                                                                                                  |
| `-c`, <br>`--collection`         | This parameter specifies the destination collection(s) in DSpace where the items will be added, replaced, or deleted. It can be either the Handle or database ID of the collection(s). |
| `-m`, <br>`--mapfile`            | This parameter specifies the name of the mapfile that maps items in the SAF to items in DSpace.                                                                                        |
| `-w`, <br>`--workflow`           | This parameter specifies whether to send the submission through the destination collection's workflow. If specified, the submission will be sent through the workflow.                 |
| `-n`, <br>`--notify`             | This parameter specifies whether to send notification emails when sending submissions through the workflow. If specified, notification emails will be sent.                            |
| `-v`, <br>`--validate`           | This parameter specifies whether to do a test run and not actually import items. If specified, the import will be validated.                                                           |
| `-x`, <br>`--exclude-bitstreams` | This parameter specifies whether to exclude content bitstreams from the import. If specified, bitstreams will not be loaded or expected. Optional.                                     |
| `-p`, <br>`--template`           | This parameter specifies whether to apply a template to the items being imported. If specified, a template will be applied.                                                            |
| `-R`, <br>`--resume`             | This parameter specifies whether to resume a failed import and add only. If specified, the import will resume from where it failed.                                                    |
| `-q`, <br>`--quiet`              | This parameter specifies whether to suppress metadata display. If specified, metadata will not be displayed.                                                                           |
| `-h`, <br>`--help`               | This parameter displays help information for the script.                                                                                                                               |

The mapfile parameter allows users to map items to existing items in the DSpace repository. This can be useful for
replacing or updating existing items, or for creating relationships between items.

The workflow parameter allows users to send items through a collection's workflow. This can be useful for ensuring that
items meet certain criteria or are reviewed before being added to the repository.
