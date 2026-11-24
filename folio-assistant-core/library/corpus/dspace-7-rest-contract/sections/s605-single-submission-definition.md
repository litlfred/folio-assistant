---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s605-single-submission-definition
section_title: "Single Submission-Definition"
file: "submissiondefinitions.md"
lines: 13-29
source_sha256: 35baec16e4144d5b
granularity: heading
---
## Single Submission-Definition
**/api/config/submissiondefinitions/<:definition-name>**

Provide detailed information about a specific submission-definition. The JSON response document is as follow
```json
{
  "name": "traditional",
  "isDefault": true,
  "type": "submission-definition"
}

```

Exposed links:
* collections: list of collections that explicitly use such submission-definition
* sections: list of submission-section included in this definition
