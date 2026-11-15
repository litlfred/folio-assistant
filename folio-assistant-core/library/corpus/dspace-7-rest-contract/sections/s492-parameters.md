---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s492-parameters
section_title: "Parameters:"
file: "scripts/index-discovery.md"
lines: 34-55
source_sha256: d9ab2a7cbc8c2261
granularity: heading
---
## Parameters:

The following parameters are available for the index-discovery script:

| Parameter                     | Description                                                                                 |
|-------------------------------|---------------------------------------------------------------------------------------------|
| `-r`, <br/>`--remove <value>` | Remove an item, collection, or community from the index based on its handle.                |
| `-i`, <br/>`--index <value>`  | Add or update an item, collection, or community based on its handle or UUID.                |
| `-c`, <br/>`--clean`          | Clean the existing index, removing any documents that no longer exist in the database.      |
| `-d`, <br/>`--delete`         | Delete all records from the existing index.                                                 |
| `-b`, <br/>`--build`          | (Re)build the index, wiping out the current one if it exists.                               |
| `-s`, <br/>`--spellchecker`   | Rebuild the spellchecker. This option can be combined with `-b` and `-f`.                   |
| `-f`, <br/>`--force`          | If updating the existing index, force each handle to be reIndexed even if it is up-to-date. |
| `-h`, <br/>`--help`           | Print the help message.                                                                     |

The clean, delete, and rebuild options are used to manage the existing index. The clean option removes any documents
from the index that no longer exist in the database. The delete option deletes all records from the existing index. The
rebuild option wipes out the current index and rebuilds it from scratch.

The spellchecker option is used to rebuild the spellchecker for the index. This can be useful if you have made changes
to the index that affect the spellchecking functionality.
