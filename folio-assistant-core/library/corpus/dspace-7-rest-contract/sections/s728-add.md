---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s728-add
section_title: "Add"
file: "workspaceitem-data-metadata.md"
lines: 51-323
source_sha256: 452bbe9cabe791be
granularity: heading
---
### Add
To add a new value to an **existent metadata** the client must send a JSON Patch ADD operation as follow

`curl -X PATCH '{dspace7-url}/api/submission/workspaceitems/<:id>' -H "Authorization: Bearer ..." -H 'Content-Type: application/json' --data '[{"op":"add","path":"/sections/<:name-of-the-form>/<:metadata>/-","value":{"value":"...","language":"...","authority":"...","confidence":-1}}]'
`

it is also possible to insert the new metadata in a specific position

`curl -X PATCH '{dspace7-url}/api/submission/workspaceitems/<:id>' -H "Authorization: Bearer ..." -H 'Content-Type: application/json' --data '[{"op":"add","path":"/sections/<:name-of-the-form>/<:metadata>/<:idx-zero-based>","value":{"value":"...","language":"...","authority":"...","confidence":-1}}]'`

for example (note that from now authentication bearer will be omitted), starting with the following document  
```json
{
	id: 1,
	type: "workspaceitem",
	sections:
	{
		"traditionalpageone": {
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
			  }   
      			]
		...
		},
		...
	},
	...
}	
```

the following request 
`curl --data '[{ "op": "add", "path": "/sections/traditionalpageone/dc.contributor.author/-", "value": {"value": "Another, Author"}}]' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`

will result in
```json
{
	id: 1,
	type: "workspaceitem",
	sections:
	{
		"traditionalpageone": {
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
			  "value": "Another, Author",
			  "language": null,
			  "authority": null,
			  "confidence": -1,
			  "place": 1
			}			  
      			]
		...
		},
		...
	},
	...
}
```

and an additional call as follow
`curl --data '[{ "op": "add", "path": "/sections/traditionalpageone/dc.contributor.author/1", "value": {"value": "Insert, Test", "authority": "rp00002", "confidence": 600}}]' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`

will get the final document
```json
{
	id: 1,
	type: "workspaceitem",
	sections:
	{
		"traditionalpageone": {
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

Please note that according to the [JSON Patch specification RFC6902](https://tools.ietf.org/html/rfc6902) to initialize a new metadata in the section the add operation must receive an array of values and it is not possible to add a single value to the not yet initialized "/sections/<:name-of-the-form>/<:metadata>/-" path.

For example the following call initialize dc.subject metadata to our previous example

`curl --data '[{ "op": "add", "path": "/sections/traditionalpageone/dc.subject", "value": [{"value": "keyword1"}]}]' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`

will get the final document
```json
{
	id: 1,
	type: "workspaceitem",
	sections:
	{
		"traditionalpageone": {
       		        "dc.subject": [
			  {
			  "value": "keyword1",
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

it is also possible to initialize or **replace** the whole metadata values sending multiple objectvalue in the call
`curl --data '[{ "op": "add", "path": "/sections/traditionalpageone/dc.subject", "value": [{"value": "keyword1"},{"value": "keyword2"}]}]' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`

```json
{
	id: 1,
	type: "workspaceitem",
	sections:
	{
		"traditionalpageone": {
		        "dc.subject": [
			  {
			  "value": "keyword1",
			  "language": null,
			  "authority": null,
			  "confidence": -1,
			  "place": 0
			  },
			  {
			  "value": "keyword2",
			  "language": null,
			  "authority": null,
			  "confidence": -1,
			  "place": 1
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

This use of the add operation to replace the list of values of a metadata could be counter intuitive but it is done according to the [RFC section 4.1](https://tools.ietf.org/html/rfc6902#section-4.1)
> If the target location specifies an object member that does exist, that member's value is replaced.

the specification explicitly say that trying to send the request against the *- array position index* will create a sub-array element, see the [specification Appendix A.16](https://tools.ietf.org/html/rfc6902#page-18)
