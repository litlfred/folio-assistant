---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s736-workspaceitem-data-of-upload-sectiontype
section_title: "WorkspaceItem data of upload sectionType"
file: "workspaceitem-data-upload.md"
lines: 1-50
source_sha256: 28bff004b93bd7d6
granularity: heading
---
# WorkspaceItem data of upload sectionType
[Back to the definition of the workspaceitems endpoint](workspaceitems.md)

The section data represent the data about the user uploaded files

```json
{
	"files": [ 
  	 	{
  	 		metadata: {
  	 			"dc.title" : [{value: "sample_file.pdf"}],
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
```
the files attribute contains the list of user uploaded file in the section. For each file the following attributes exist
* metadata: the map of the metadata assigned to the specific file with [the same structure](workspaceitem-data-metadata.md) used in the submission-form sectionType for the item metadata
* sizeBytes (**READ-ONLY**): the size of the received file as calculated on the server at the receiving time 
* checkSum (**READ-ONLY**): the checksum details (algorithm and value) of the received file as calculated on the server at the receiving time
* url (**READ-ONLY**): from where the file can be downloaded
* accessConditions: an array of all the policies that has been applied by the user to the file.
