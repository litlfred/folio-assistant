---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s069-browse-types
section_title: "Browse types"
file: "browses.md"
lines: 11-33
source_sha256: 847a5e835b2cd033
granularity: heading
---
## Browse types

There are currently types of browse, each behaving differently:
* `valueList`:
  * The browse index has two levels
  * The 1st level shows the list of entries like author names, subjects, types, etc
  * The second level is the actual list of items linked to a specific entry
  * The `items` link is not used
  * The `entries` link is used to render the author names, subjects, types, etc
  * The `vocabulary` link is not used
* `flatBrowse`:
  * The browse index has one level: the full list of items
  * The `items` link is used to render this list of items
  * The `entries` link is not used
  * The `vocabulary` link is not used
* `hierarchicalBrowse`:
  * The browse index displays the vocabulary tree
  * The 1st level shows the tree
  * The second level is the actual list of items linked to a specific entry
  * The `items` link is not used
  * The `entries` link is not used
  * The `vocabulary` link is used to render the tree
