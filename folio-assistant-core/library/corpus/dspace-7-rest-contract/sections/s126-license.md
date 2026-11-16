---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s126-license
section_title: "License"
file: "collections.md"
lines: 259-272
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
### License
**/api/core/collections/<:uuid>/license**

Return information about the license template in use by the collection. The json representation is as follow
```json
{
  "custom": false,
  "text": "NOTE: PLACE YOUR OWN LICENSE HERE\nThis sample license is provided for informational purposes only.\n\nNON-EXCLUSIVE DISTRIBUTION LICENSE\n\nBy signing and submitting this license, you (the author(s) or copyright\nowner) grants to DSpace University (DSU) the non-exclusive right to reproduce,\ntranslate (as defined below), and/or distribute your submission...."
}
```

* custom (**READ-ONLY**): can be true or false. True means that a custom license has been set for the collection otherwise the site license template is used and returned in the text attribute
* text: contains the textual value of the license template to use for submission in the collection
