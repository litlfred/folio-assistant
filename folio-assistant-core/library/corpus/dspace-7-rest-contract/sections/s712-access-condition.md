---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s712-access-condition
section_title: "Access Condition"
file: "workspaceitem-data-access.md"
lines: 93-109
source_sha256: b63435c1bff84133
granularity: heading
---
#### Access Condition
You can replace an existent access condition with a new one or update some settings of an existent access condition using the replace operation. The new settings must be valid for the selected access condition (name) according to the [submissionaccessoptions configuration endpoint](submissionaccessoptions.md).

To replace an access condition with a new one

`curl --data '{[ { "op": "replace", "path": "/sections/<:name-of-the-form>/accessConditions/0", "value": {name: "embargo", startDate: "2018-12-31"}}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

to update the embargo start date

`curl --data '{[ { "op": "replace", "path": "/sections/<:name-of-the-form>/accessConditions/0/startDate", "value": "2019-12-31"}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

to transform an existent *openaccess* access condition to an *administrator* access condition

`curl --data '{[ { "op": "replace", "path": "/sections/<:name-of-the-form>/accessConditions/0/name", "value": "administrator"}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

please note that the above works only because of openaccess and administrator have the same settings needs (no need of addition information). Indeed, the backend is expected to remove the existent policy and create a new policy. If the settings of the previous and new access condition differs the request must fail with a 422 error code
