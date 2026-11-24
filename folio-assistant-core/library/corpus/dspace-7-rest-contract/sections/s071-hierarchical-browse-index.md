---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s071-hierarchical-browse-index
section_title: "Hierarchical browse index"
file: "browses.md"
lines: 84-118
source_sha256: 847a5e835b2cd033
granularity: heading
---
## Hierarchical browse index 
**/api/discover/browses/<:index-name>**

Provide detailed information about a specific hierarchical browse index and access to the parameters required to access the list of items and entries. The JSON response document is as follows
```json
{
  "id": "keyword",
  "browseType": "hierarchicalBrowse",
  "facetType": "subject",
  "vocabulary": "srsc",
  "type": "browse",
  "metadata": [
    "dc.subject"
  ],
  "_links" : {
    "vocabulary" : {
      "href" : "/server/api/submission/vocabularies/srsc"
    }
  }
} 
```

* id: the identifier for the browse index
* browseType: `hierarchicalBrowse` if the browse index should display the vocabulary tree. The 1st level shows the tree. The second level is the actual list of items linked to a specific entry
* facetType: the discovery filter to use to filter the items
* vocabulary: the name of the vocabulary containing the tree
* metadata: the list of metadata used to build this index

Exposed links:
* vocabulary: link to the vocabulary containing the tree

Error codes:

**404** if the browse index doesn't exist
