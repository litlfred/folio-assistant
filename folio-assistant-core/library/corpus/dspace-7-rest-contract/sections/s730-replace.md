---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s730-replace
section_title: "Replace"
file: "workspaceitem-data-metadata.md"
lines: 419-491
source_sha256: 452bbe9cabe791be
granularity: heading
---
### Replace
The replace operation allows to replace *existent* information with new one. Attempt to use the replace operation to set not yet initialized information must return an error. See [general errors on PATCH requests](patch.md)

To change the title of the previous example
`curl --data '[{ "op": "replace", "path": "/sections/traditionalpageone/dc.title/0", "value": {"value": "Modified title", "language":"it_IT"}}]' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`
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
         		  "value": "Modified Item",
          		  "language": "it_IT",
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

It is also possible to change only the language of the existent title 
`curl --data '[{ "op": "replace", "path": "/sections/traditionalpageone/dc.title/0/language", "value": "en_US"}]' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`
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
         		  "value": "Modified Item",
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
