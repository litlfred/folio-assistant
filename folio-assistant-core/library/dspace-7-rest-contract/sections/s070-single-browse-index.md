---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s070-single-browse-index
section_title: "Single browse index"
file: "browses.md"
lines: 34-83
source_sha256: 847a5e835b2cd033
granularity: heading
---
## Single browse index 
**/api/discover/browses/<:index-name>**

Provide detailed information about a specific browse index and access to the list of items and entries in the index. The JSON response document is as follow
```json
{
  "id": "title",
  "browseType": "flatBrowse",
  "metadataBrowse": false,
  "dataType": "title",
  "sortOptions": [
    {
      "name": "title",
      "metadata": "dc.title"
    },
    {
      "name": "dateissued",
      "metadata": "dc.date.issued"
    },
    {
      "name": "dateaccessioned",
      "metadata": "dc.date.accessioned"
    }
  ],
  "order": "ASC",
  "type": "browse",
  "metadata": [
    "dc.date.issued"
  ]
} 
```

* id: the identifier for the browse index
* browseType:
  * `valueList` if the browse index has two levels, the 1st level shows the list of entries like author names, subjects, types, etc. the second level is the actual list of items linked to a specific entry
  * `flatBrowse` if the browse index has one level: the full list of items
* metadataBrowse: true if the browse index have two level, the 1st level shows the list of entries like author names, subjects, types, etc. the second level is the actual list of items linked to a specific entry
* dataType: the kind of data indexed. Can have the values "title" for item titles, "date" for date fields or "text" for other metadata
* sortOptions: the sort options available for this index
* order: the default order applied to the index
* metadata: the list of metadata used to build this index

Exposed links:
* items: link to get the actual list of items associated with the index
* entries (**only for metadata browse index**): link to get the list of entries in the metadata index

Error codes:

**404** if the browse index doesn't exist
