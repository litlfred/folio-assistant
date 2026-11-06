---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s722-add
section_title: "Add"
file: "workspaceitem-data-license.md"
lines: 23-90
source_sha256: aadd1539f4aba55d
granularity: heading
---
### Add
To accept a license the client must send a JSON Patch ADD operation to the *granted* path as follow

`curl --data '{[ { "op": "add", "path": "/sections/<:name-of-the-form>/granted", "value": true}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

for example, starting with the following document  
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

the following request 
`curl --data '{[ { "op": "add", "path": "/sections/license/acceptanceDate", "value": "2017-11-20T10:32:42Z"}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`

will result in
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

Please note that according to the [JSON Patch specification RFC6902](https://tools.ietf.org/html/rfc6902) a subsequent add operation on the granted will have the effect to replace the previous granted license with a new one. 
In this case a new bitstream license will be added to the item and the previous license deleted, this mean that the *url* and *acceptedDate* attributes will change accordly.

It is also possible to send a PATH add operation using *false* as value to reject / remove a license.

This use of the add operation to replace the license could be counter intuitive but it is done according to the [RFC section 4.1](https://tools.ietf.org/html/rfc6902#section-4.1)
> If the target location specifies an object member that does exist, that member's value is replaced.
