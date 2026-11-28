---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s724-remove
section_title: "Remove"
file: "workspaceitem-data-license.md"
lines: 98-153
source_sha256: aadd1539f4aba55d
granularity: heading
---
### Remove
It is possible to remove a previous grant license 
`curl --data '{[ { "op": "remove", "path": "/sections/license/granted"}]' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`

trasforming
```json
{
	id: 1,
	type: "workspaceitem",
	sections:
	{
		"traditional-page1":
			{
			  "dc.title" : [{value: "Sample Submission Item", language: "en"}],
			  "dc.contributor.author" : [
			  	 		{value: "Bollini, Andrea", authority: "rp00001", confidence: 600}
			  ]
			},
		"license":
			{
				"granted": true,
			  	"url": "https://demo.dspace.org/server/api/core/bitstreams/004a297e-fd06-4662-ae51-73e4b7c165c8/content",
			    "acceptanceDate": "2017-11-20T10:32:42Z"
			}
		...
	},
	...
}	
```

back in
```json
{
	id: 1,
	type: "workspaceitem",
	sections:
	{
		"traditional-page1":
			{
			  "dc.title" : [{value: "Sample Submission Item", language: "en"}],
			  "dc.contributor.author" : [
			  	 		{value: "Bollini, Andrea", authority: "rp00001", confidence: 600}
			  ]
			},
		"license":
			{
				"granted": false,
			  	"url": null,
			    "acceptanceDate": null
			}
		...
	},
	...
}	
```
