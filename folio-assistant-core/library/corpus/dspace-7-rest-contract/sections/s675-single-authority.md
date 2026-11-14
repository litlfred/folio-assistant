---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s675-single-authority
section_title: "Single Authority"
file: "vocabularyEntryDetails.md"
lines: 11-61
source_sha256: 6d0ee33dcbc81ad3
granularity: heading
---
## Single Authority
**/api/submission/vocabularyEntryDetails/<:vocabulary-name>:<:entry-id>**

Provide detailed information about a specific vocabulary entry. The JSON response document is as follow
```json
{
      "id" : "srsc:SCB110",
      "value" : "Research Subject Categories::HUMANITIES and RELIGION::Religion/Theology",
      "display" : "Religion/Theology",
      "selectable" : true,
      "otherInformation" : {
          "id": "SCB110",
          "note" : "Religionsvetenskap/Teologi",
          "parent": "HUMANITIES and RELIGION",
          "hasChildren": "true"
      },
      "type" : "vocabularyEntryDetail",
      "_links" : {
        "self" : {
          "href" : "http://localhost/api/submission/vocabularyEntryDetails/srsc:SCB110"
        },
        "vocabulary" : {
          "href" : "http://localhost/api/submission/vocabularies/srsc"
        },
        "parent" : {
          "href" : "http://localhost/api/submission/vocabularyEntryDetails/srsc:SCB110/parent"
        },
        "children" : {
          "href" : "http://localhost/api/submission/vocabularyEntryDetails/srsc:SCB110/children"
        },
      }
    }
```

Attributes:
* id: the unique id of the entry
* value: the preferred value to store for the entry
* display: the preferred value to display for the entry
* selectable: in an hierachical vocabulary it could be required to allow the selection only of leaves in the tree 
* otherInformation: an map of additional string attributes useful to provide more context in the UI for the selection

Exposed links:
* vocabulary: the vocabulary that the entry belong to
* parent: for hierarchical vocabulary, the detail entry parent of the current detail entry, if any
* children: for hierarchical vocabulary, the list of children detail entries, if any

Return codes:
* 200 OK - if the operation succeed
* 404 Not Found - if the vocabulary entry is missing or the resource ID is malformed
* 401 Unauthorized - if you are not authenticated
