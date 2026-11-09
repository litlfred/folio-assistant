---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s612-main-endpoint
section_title: "Main Endpoint"
file: "submissionforms.md"
lines: 6-13
source_sha256: 2001b9074130093e
granularity: heading
---
## Main Endpoint
**/api/config/submissionforms**   

Provide access to the configured submission-forms. It returns the list of existent submission-forms.
Please note that from DSpace 7 the submission-form concept has been introduced splitting the previous configuration file named input-forms.xml by page. Each submission-form describes a single page of inputs, combining different pages together is done with the [submission-definition](submissiondefinitions.md), aka the item-submission.xml configuration file 

Example: to be provided
