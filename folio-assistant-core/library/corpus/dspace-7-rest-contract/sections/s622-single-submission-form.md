---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s622-single-submission-form
section_title: "Single Submission-Form"
file: "submissionuploads.md"
lines: 14-55
source_sha256: b42751281c6064c3
granularity: heading
---
## Single Submission-Form 
**/api/config/submissionuploads/<:upload-name>**

*:upload-name* is initially hard-coded to *default*

Provide detailed information about a specific input-form. The JSON response document is as follows:
```json
{
  "id": "default",
  "required": true,
  "max-size": 536870912,
  "accessConditionOptions": [
		{
 			"name": "openaccess"
		},
		{
 			"name": "administrator"
		},  	 			
		{
 			"name": "embargo",
 			"hasStartDate": true,
 			"maxStartDate": "2018-06-24T00:40:54.970+0000"
		},
		{
 			"name": "lease",
 			"hasEndDate": true,
 			"maxEndDate": "2017-12-24T00:40:54.970+0000"
		}
  ]
}

```
The attributes of the objects in the accessConditionOptions arrays are as follow:
* The *name* attribute is an identifier that can be used by the REST client (the UI) to present the different options to the user, maybe translating it in an human readable format using i18n, and by the backend to create the ResourcePolicy to apply to the uploaded file using and validating the additional inputs provided by the user where required.
* If there is a *hasStartDate* attribute and it is true, the access condition to be applied requires to specify a startDate that must be less or equal than the value of the *maxStartDate* attribute (if null any date is acceptable)
* If there is a *hasEndDate* attribute and it is true, the access condition to be applied requires to specify an endDate that must be less or equal than the value of the *maxEndDate* attribute (if null any date is acceptable). If a startDate is supplied the endDate must be greater than the startDate

A null value for the accessConditionOptions attribute means that the upload step doesn't allow the user to set a policy for the file. The file will get only the policies inherited from the collection.

Exposed links:
* metadata: it is a link to the submission-form to use for the files metadata
