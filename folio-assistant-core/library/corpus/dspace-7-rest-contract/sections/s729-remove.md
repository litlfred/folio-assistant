---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s729-remove
section_title: "Remove"
file: "workspaceitem-data-metadata.md"
lines: 324-418
source_sha256: 452bbe9cabe791be
granularity: heading
---
### Remove
It is possible to remove a specific metadatavalue
`curl --data '[{ "op": "remove", "path": "/sections/traditionalpageone/dc.subject/0"}]' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`

trasforming above json example in
```json
{
	id: 1,
	type: "workspaceitem",
	sections:
	{
		"traditionalpageone": {
		        "dc.subject": [
			  {
			  "value": "keyword2",
			  "language": null,
			  "authority": null,
			  "confidence": -1,
			  "place": 0
			  }
		        ],
      			"dc.title": [
        		  {
         		  "value": "Sample Submission Item",
          		  "language": "en_US",
          		  "authority": null,
          		  "confidence": -1,
          		  "place": 0
        		  }
      			],
			"dc.contributor.author": [
			  {
			  "value": "Bollini, Andrea",
			  "language": null,
			  "authority": "rp00001",
			  "confidence": 600,
			  "place": 0
			  },
			{
			  "value": "Insert, Test",
			  "language": null,
			  "authority": "rp00002",
			  "confidence": 600,
			  "place": 1
			},			  
 			{
			  "value": "Another, Author",
			  "language": null,
			  "authority": null,
			  "confidence": -1,
			  "place": 2
			}			  
      			]
		...
		},
		...
	},
	...
}	
```
or removing all the metadata values for a specific metadata key
`curl --data '[{ "op": "remove", "path": "/sections/traditionalpageone/dc.contributor.author"}]' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`
```json
{
	id: 1,
	type: "workspaceitem",
	sections:
	{
		"traditionalpageone": {
		        "dc.subject": [
			  {
			  "value": "keyword2",
			  "language": null,
			  "authority": null,
			  "confidence": -1,
			  "place": 0
			  }
		        ],
      			"dc.title": [
        		  {
         		  "value": "Sample Submission Item",
          		  "language": "en_US",
          		  "authority": null,
          		  "confidence": -1,
          		  "place": 0
        		  }
      			]
		...
		},
		...
	},
	...
}	
```
