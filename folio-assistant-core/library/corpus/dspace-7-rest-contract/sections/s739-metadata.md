---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s739-metadata
section_title: "Metadata"
file: "workspaceitem-data-upload.md"
lines: 59-131
source_sha256: 28bff004b93bd7d6
granularity: heading
---
#### Metadata
To add a value to an **existent metadata** the client must send a JSON Patch ADD operation as follow

`curl --data '{[ { "op": "add", "path": "/sections/<:name-of-the-form>/files/<:file-idx>/metadata/<:metadata>/-", "value": {value: "...", authority: "...", confidence: 600, language: ".."}}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

it is also possible to insert the new metadata in a specific position

`curl --data '{[ { "op": "add", "path": "/sections/<:name-of-the-form>/files/<:file-idx>/metadata/<:metadata>/<:idx-zero-based>", "value": {value: "...", authority: "...", confidence: 600, language: ".."}}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

To **initialize or replace completely** the values of a specific metadata

`curl --data '{[ { "op": "add", "path": "/sections/<:name-of-the-form>/files/<:file-idx>/metadata/<:metadata>", "value": [{value: "...", authority: "...", confidence: 600, language: ".."}]}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`
 
for instance the call
`curl --data '{[ { "op": "add", "path": "/sections/uploads/files/0/metadata/dc.title", "value": [{value: "MyFile.pdf"}]}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`

will set the title of the first uploaded file to MyFile.pdf returning the following json document
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
		"uploads":
		{	
			"files": [ 
	  	 	{
	  	 		metadata: {
	  	 			"dc.title" : [{value: "MyFile.pdf"}],
	  	 			"dc.description" : [{value: "Description of the sample file"}]
	  	 		},
	  	 		"sizeBytes": 8528,
				"checkSum": {
				    "checkSumAlgorithm": "MD5",
				    "value": "9d8f0f9e369cf12159d47c146c499cf4"
				},
	  	 		"url": "https://demo.dspace.org/server/api/core/bitstreams/00001abf-b2e0-477a-99de-104db7cb6469/content",
	  	 		"accessConditions": [
	  	 			{
	  	 				"id": 123,
		  	 			"name": "openaccess"
	  	 			},
	  	 			{
	  	 				"id": 126,
		  	 			"name": "administrator"
	  	 			},
	  	 			{
	  	 				"id": 127,
		  	 			"name": "embargo",
		  	 			"startDate": "2018-06-24T00:40:54.970+0000"
	  	 			},
	  	 			{
	  	 				"id": 128,
		  	 			"name": "lease",
		  	 			"endDate": "2017-12-24T00:40:54.970+0000"
	  	 			}
	  	 		]
	 		}
 		]
		}
	}
}
```

you can find more example to manipulate metadata in the documentation about [the submission-form sectionType](workspaceitem-data-metadata.md) you will only need to use the *path* to the file'metadata as specified above, i.e. adding /files/<:idx-file>/metadata/
