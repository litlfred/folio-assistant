---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s691-single-workflow-item
section_title: "Single Workflow Item"
file: "workflowitems.md"
lines: 11-90
source_sha256: 568b9a61283641e9
granularity: heading
---
## Single Workflow Item
**/api/workflow/workflowitems/<:id>**

Provide detailed information about a specific workflowitem. The JSON response document is as follow

```json
{
  "id": 1911,
  "lastModified": "2017-06-24T00:40:54.970+0000",
  "step": "editstep",
  "sections": {
  	 "collection": "05457c63-b392-4629-a373-f2d66ee9ee33",
  	 "traditional-page1": {
  	 	"dc.title" : [{value: "Sample Workflow Item"}],
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
  "type": "workflowitem"
}
```

Similary  to the [Workspace Item](workspaceitems.md) the actual data of the inprogress submission are arranged in *sections* map following the sections configured in the submissionDefinition. This map is *open for extension*, each type of section will expose a different JSON structure. See the [out-of-box submission section types](submissionsection-types.md) page for details. An additional step attribute containing the id of the reached step in the workflow is present

Exposed links:
* step: the workflow step
* collection: the collection where the inprogress submission will be created
* item: the item that hold the submission data
* submissionDefinition: the [submission definition](submissiondefinitions.md) used by this inprogress submission
