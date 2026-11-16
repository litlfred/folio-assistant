---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s740-access-condition
section_title: "Access Condition"
file: "workspaceitem-data-upload.md"
lines: 132-152
source_sha256: 28bff004b93bd7d6
granularity: heading
---
#### Access Condition
To add an access condition the client must send a JSON Patch ADD operation as follow

`curl --data '{[ { "op": "add", "path": "/sections/<:name-of-the-form>/files/<:file-idx>/accessConditions/-", "value": {name: "...", endDate: ".."}}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

to **replace completely** the access conditions applied to a specific file

`curl --data '{[ { "op": "add", "path": "/sections/<:name-of-the-form>/files/<:file-idx>/accessCondition", "value": [{name: "...", endDate: ".."}]}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>

The exact attributes that the access condition to add must have depend on the name attribute that will identify the access condition configuration as exposed by the [submissionupload configuration endpoint](submissionuploads.md).
For instance the following request is valid
`curl --data '{[ { "op": "add", "path": "/sections/<:name-of-the-form>/files/<:file-idx>/accessConditions/-", "value": {name: "openaccess"}}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

instead the request
`curl --data '{[ { "op": "add", "path": "/sections/<:name-of-the-form>/files/<:file-idx>/accessConditions/-", "value": {name: "embargo"}}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

will be rejected because a startDate attribute is also expected when an embargo is applied (according to the example configuration listed in this doc for the [submissionupload configuration endpoint](submissionuploads.md). The right request will be
`curl --data '{[ { "op": "add", "path": "/sections/<:name-of-the-form>/files/<:file-idx>/accessConditions/-", "value": {name: "embargo", startDate: "2018-12-31"}}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

Please note that doesn't make sense to add an access condition in a specific index and, to simplify the client implementation it was assumed that the accessCondition array is never *null* but eventually an empty array so that you call always append new AccessCondition to the path "/sections/<:name-of-the-form>/files/<:file-idx>/accessCondition/-".
