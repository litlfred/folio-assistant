---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s617-single-submission-definition
section_title: "Single Submission-Definition"
file: "submissionsections.md"
lines: 14-37
source_sha256: fee8f72050b5f2ca
granularity: heading
---
## Single Submission-Definition
**/api/config/submissionsections/<:section-name>**

Provide detailed information about a specific submission-section. The JSON response document is as follow
```json
{
  	id: "id-of-the-submission-form-page",
  	header: "First page",
  	mandatory: true,
  	sectionType: "submission-form",
  	scope: null,
  	type: "submissionsection",
  	_links: {
  		"config" : "<dspace-url>/config/submissionforms/<:id-of-the-submission-form-page>" 
  	}
}
```

* the *header* attribute is the label or the i18n key to use to present the section to the user
* the *mandatory* attribute defines if the section MUST be used by each submission. Otherwise, the user is allowed to enable/disable the section interacting with the workspaceitem
* the *scope* attribute can be null or one of the values: workflow or submission. A value other than *null* mean that the section will be only available during the specified phase 
* the *sectionType* attribute defines the kind of section that the UI will need to use to interact with the data. See the [documentation about the available values for sectionType provided here](submissionsection-types.md)
