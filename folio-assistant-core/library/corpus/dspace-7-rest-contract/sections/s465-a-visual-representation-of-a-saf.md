---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s465-a-visual-representation-of-a-saf
section_title: "A visual representation of a SAF"
file: "scripts/export.md"
lines: 86-188
source_sha256: 6351728cf9d36a6c
granularity: heading
---
## A visual representation of a SAF

<details>
  <summary>archive_directory/</summary>

  <details>
    <summary>item_000/</summary>

    * dublin_core.xml         -- qualified Dublin Core metadata for metadata fields belonging to the 'dc' schema.
    * metadata_[prefix].xml   -- metadata in another schema.  The prefix is the name of the schema as registered with the metadata registry.
    * contents                -- text file containing one line per filename.
    * collections             -- (Optional) text file that contains the handles of the collections the item will belong to. Each handle in a row. Collection in first line will be the owning collection.
    * relationships           -- (Optional) If importing Entities, you can specify one or more relationships to create on import
    * file_1.doc              -- files to be added as bitstreams to the item.
    * file_2.pdf
  </details>

  <details>
    <summary>item_001/</summary>

    * dublin_core.xml         -- qualified Dublin Core metadata for metadata fields belonging to the 'dc' schema.
    * metadata_[prefix].xml   -- metadata in another schema.  The prefix is the name of the schema as registered with the metadata registry.
    * contents                -- text file containing one line per filename.
    * collections             -- (Optional) text file that contains the handles of the collections the item will belong to. Each handle in a row. Collection in first line will be the owning collection.
    * relationships           -- (Optional) If importing Entities, you can specify one or more relationships to create on import
    * file_1.doc              -- files to be added as bitstreams to the item.
    * file_2.pdf
  </details>

  <details>
    <summary>item_002/</summary>

    * dublin_core.xml         -- qualified Dublin Core metadata for metadata fields belonging to the 'dc' schema.
    * metadata_[prefix].xml   -- metadata in another schema.  The prefix is the name of the schema as registered with the metadata registry.
    * contents                -- text file containing one line per filename.
    * collections             -- (Optional) text file that contains the handles of the collections the item will belong to. Each handle in a row. Collection in first line will be the owning collection.
    * relationships           -- (Optional) If importing Entities, you can specify one or more relationships to create on import
    * file_1.doc              -- files to be added as bitstreams to the item.
    * file_2.pdf
  </details>
  <details>
    <summary>item_003/</summary>

    * dublin_core.xml         -- qualified Dublin Core metadata for metadata fields belonging to the 'dc' schema.
    * metadata_[prefix].xml   -- metadata in another schema.  The prefix is the name of the schema as registered with the metadata registry.
    * contents                -- text file containing one line per filename.
    * collections             -- (Optional) text file that contains the handles of the collections the item will belong to. Each handle in a row. Collection in first line will be the owning collection.
    * relationships           -- (Optional) If importing Entities, you can specify one or more relationships to create on import
    * file_1.doc              -- files to be added as bitstreams to the item.
    * file_2.pdf
  </details>

  <details>
    <summary>item_004/</summary>

    * dublin_core.xml         -- qualified Dublin Core metadata for metadata fields belonging to the 'dc' schema.
    * metadata_[prefix].xml   -- metadata in another schema.  The prefix is the name of the schema as registered with the metadata registry.
    * contents                -- text file containing one line per filename.
    * collections             -- (Optional) text file that contains the handles of the collections the item will belong to. Each handle in a row. Collection in first line will be the owning collection.
    * relationships           -- (Optional) If importing Entities, you can specify one or more relationships to create on import
    * file_1.doc              -- files to be added as bitstreams to the item.
    * file_2.pdf
  </details>
 
  <details>
    <summary>item_005/</summary>

    * dublin_core.xml         -- qualified Dublin Core metadata for metadata fields belonging to the 'dc' schema.
    * metadata_[prefix].xml   -- metadata in another schema.  The prefix is the name of the schema as registered with the metadata registry.
    * contents                -- text file containing one line per filename.
    * collections             -- (Optional) text file that contains the handles of the collections the item will belong to. Each handle in a row. Collection in first line will be the owning collection.
    * relationships           -- (Optional) If importing Entities, you can specify one or more relationships to create on import
    * file_1.doc              -- files to be added as bitstreams to the item.
    * file_2.pdf
  </details>
</details>


In the above format, the directory archive_directory is the top-level directory, and each item is a subdirectory within
it.

Each item subdirectory contains the following files and directories:

`dublin_core.xml`:
This is a qualified Dublin Core metadata file that contains metadata fields belonging to the 'dc' schema.

`metadata_[prefix].xml`: This is a metadata file that contains metadata in another schema. The prefix is the name of the
schema as registered with the metadata registry.

`contents`: This is a text file that contains one line per filename.

`collections`: (Optional) This is a text file that contains the handles of the collections the item will belong to. Each
handle is in a row, and the collection in the first line will be the owning collection.

`relationships`: (Optional) If importing entities, you can specify one or more relationships to create on import.

`file_1.doc`, `file_2.pdf`, `etc.`: These are the files that make up the item and will be added as bitstreams to the
item.
