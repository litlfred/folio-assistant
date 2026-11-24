---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s753-single-workspace-item
section_title: "Single Workspace Item"
file: "workspaceitems.md"
lines: 48-130
source_sha256: 1bb50597a317b780
granularity: heading
---
## Single Workspace Item
**/api/submission/workspaceitems/<:id>**

Provide detailed information about a specific workspaceitem. The JSON response document is as follow
```json
{
  "id": 1911,
  "lastModified": "2017-06-24T00:40:54.970+0000",
  "sections": {
  	 "collection": "05457c63-b392-4629-a373-f2d66ee9ee33",
     "identifiers" : {
        "handle" : "http://localhost:4000/handle/123456789/6",
        "doi" : "https://doi.org/10.5072/dspace/2",
        "otherIdentifiers" : [ ]
     },
  	 "traditional-page1": {
  	 	"dc.title" : [{value: "Sample Submission Item"}],
  	 	"dc.contributor.author" : [
  	 		{value: "Bollini, Andrea", authority: "rp00001", confidence: 600}
  	 	]
  	 },
  	 "traditional-page2": {
  	 	"dc.subject" : [{value: "Test"}, {value: "JSON"}, {value: "REST"}],
  	 	"dc.description.abstract" : [
  	 		{value: "This is a long multiline text\n This is a second line of the abstract"}
  	 	]
  	 },
  	 "license": {
  	 	acceptanceDate: "2017-06-24T00:40:54.970+0000",
  	 	url: "https://demo.dspace.org/server/api/core/bitstreams/8d33bdfb-e7ba-43e6-a93a-f445b7e8a1e2/content"
  	 },
  	 "uploads": [ 
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
  	},
  	 "cclicense": {
  	 	"image-url": "https://i.creativecommons.org/l/by/4.0/88x31.png",
  	 	"license-uri": "https://creativecommons.org/licenses/by/4.0/"
  	 }
  },
  "type": "workspaceitem"
}
```

The actual data of the inprogress submission are arranged in *sections* map following the sections configured in the submissionDefinition. This map is *open for extension*, each type of section will expose a different JSON structure. See the [out-of-box submission section types](submissionsection-types.md) page for details.

Exposed links:
* collection: the collection where the inprogress submission will be created
* item: the item that hold the submission data
* submissionDefinition: the [submission definition](submissiondefinitions.md) used by this inprogress submission
* supervisionOrders: list of [supervision orders](supervisionorders.md) defined for the workspace item
