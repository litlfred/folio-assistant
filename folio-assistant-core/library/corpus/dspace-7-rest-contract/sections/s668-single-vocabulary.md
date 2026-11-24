---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s668-single-vocabulary
section_title: "Single Vocabulary"
file: "vocabularies.md"
lines: 78-102
source_sha256: 67f98500ba3827b6
granularity: heading
---
## Single Vocabulary
**/api/submission/vocabularies/<:vocabulary-name>**

Provide detailed information about a specific controlled vocabulary. The JSON response document is as follow
```json
{
  "id": "srsc",
  "name": "srsc",
  "scrollable": false,
  "hierarchical": true,
  "preloadLevel": 1,
  "type": "vocabulary"
}
```

Attributes
* id: the id of the vocabulary, it is the same than the name. The id must be Alphanumeric, i.e [A-z0-9]
* name: see id
* scrollable: if true mean that it is possible to scroll all the entries in the authority without providing a filter parameter, see [vocabulary entries](vocabularies.md#controlled-vocabulary-entries)
* hierarchical: if true means that the vocabulary expose a tree structure where some entries are parent of others
* preloadLevel: for hierarchical vocabularies express the preference to preload the tree at a specific level of depth (0 only the top nodes are shown, 1 also their children are preloaded and so on)

Exposed links:
* entries: get entries from the controlled vocabulary
