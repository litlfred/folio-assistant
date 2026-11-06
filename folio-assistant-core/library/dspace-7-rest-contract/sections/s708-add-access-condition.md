---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s708-add-access-condition
section_title: "Add Access Condition"
file: "workspaceitem-data-access.md"
lines: 40-65
source_sha256: b63435c1bff84133
granularity: heading
---
### Add Access Condition
To add an access condition the client must send a JSON Patch ADD operation as follow

`curl --data '{[ { "op": "add", "path": "/sections/<:name-of-the-form>/accessConditions/-", "value": {name: "...", endDate: ".."}}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

to **replace completely** the access conditions applied to a specific workspaceItem

`curl --data '{[ { "op": "add", "path": "/sections/<:name-of-the-form>/accessConditions", "value": [{name: "...", endDate: ".."}]}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

The exact attributes that the access condition to add must have depend on the name attribute that will identify the access condition configuration as exposed by the [submissionaccessoptions configuration endpoint](submissionaccessoptions.md).
For instance the following request is valid

`curl --data '{[ { "op": "add", "path": "/sections/<:name-of-the-form>/accessConditions/-", "value": {name: "openaccess"}}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

instead the request

`curl --data '{[ { "op": "add", "path": "/sections/<:name-of-the-form>/accessConditions/-", "value": {name: "embargo"}}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

will be rejected because a startDate attribute is also expected when an embargo is applied (according to the example configuration listed in this doc for the [submissionaccessoptions configuration endpoint](submissionaccessoptions.md). 

The right request will be

`curl --data '{[ { "op": "add", "path": "/sections/<:name-of-the-form>/accessConditions/-", "value": {name: "embargo", startDate: "2018-12-31"}}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

Please note that doesn't make sense to add an access condition in a specific index and, to simplify the client implementation it was assumed that the accessCondition array is never *null* but eventually an empty array so that you call always append new AccessCondition to the path "/sections/access /accessCondition/-".
