---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s714-workspaceitem-data-of-cc-license-sectiontype
section_title: "WorkspaceItem data of CC License sectionType"
file: "workspaceitem-data-cclicense.md"
lines: 1-41
source_sha256: 90c32c8eeac8db58
granularity: heading
---
# WorkspaceItem data of CC License sectionType
[Back to the definition of the workspaceitems endpoint](workspaceitems.md)

The section data represents the data about the CC license

```json
{
  	"uri": "http://creativecommons.org/licenses/by-nc-sa/3.0/us/",
  	"rights": "Attribution-NonCommercial-ShareAlike 3.0 United States",
	"file":  
  	 	{
          "uuid": "1ce6db0e-662f-4a13-ba87-c371ad664b14",
          "name": "license_rdf",
          "handle": null,
          "metadata": {
              "dc.title": [
                {
                  "value": "license_rdf",
                  "language": null,
                  "authority": null,
                  "confidence": -1,
                  "place": 0
                }
              ]
          },
          "sizeBytes": 1012,
          "checkSum": {
            "checkSumAlgorithm": "MD5",
            "value": "59a4cfd819ce67ba7252efc52d1eb99b"
          },
          "sequenceId": 1,
          "type": "bitstream"
        }
}
```

The following attributes can be defined:
* uri: the URI of the CC License, typically stored in dc.rights.uri, null is no license is granted
* rights: the rights name of the CC License, typically stored in dc.rights, null is no license is granted
* file: the bitstream containing the license, null is no license is granted
