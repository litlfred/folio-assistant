---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s461-parameters
section_title: "Parameters"
file: "scripts/export.md"
lines: 38-68
source_sha256: 6351728cf9d36a6c
granularity: heading
---
## Parameters

It takes several parameters to customize the export, such as the type of object to export, the ID or handle of the
object, the sequence number to begin exporting items with, whether to export for migration, and whether to exclude
bitstreams.

The following parameters are available for the export script:

| Parameter                         | Description                                                                              |
|-----------------------------------|------------------------------------------------------------------------------------------|
| `-t`, <br/>`--type <value>`       | The type of item to export. Valid values include: COLLECTION or ITEM.                    |
| `-i`, <br/>`--id <value>`         | The ID or handle of the thing to export.                                                 |
| `-n`, <br/>`--number <value>`     | The sequence number to begin exporting items with.                                       |
| `-m`, <br/>`--migrate`            | Export for migration (remove handle and metadata that will be re-created in new system). |
| `-x`, <br/>`--exclude-bitstreams` | Do not export bitstreams.                                                                |
| `-h`, <br/>`--help`               | Show help.                                                                               |

The type parameter specifies whether to export a collection or an item. If exporting a collection, the script will
export all items within the collection. The ID parameter specifies the ID or handle of the item or collection to be
exported.

The number parameter is used to specify the sequence number to begin exporting items with. This parameter is useful when
exporting large collections, as it allows you to export items in batches rather than exporting the entire collection at
once.

The migrate parameter is used to export items for migration. When exporting items for migration, the script will remove
the handle and metadata that will be re-created in the new system.

The exclude-bitstreams parameter is used to exclude bitstreams from the export. This parameter can be useful when
exporting large collections that contain many large files, as it can reduce the size of the resulting SAF file.
