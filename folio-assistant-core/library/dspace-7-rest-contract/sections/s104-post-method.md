---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s104-post-method
section_title: "POST Method"
file: "claimedtasks.md"
lines: 91-108
source_sha256: bffc31e318cbb41a
granularity: heading
---
## POST Method
To create a claimedtask, i.e. to claim a pooltask. 
The pooltask must be supplied as URI in the request body using the text/uri-list content-type
If successful a 201 code will be returned along with the new claimedtask. The pooltask will also be removed.

An example curl call:
```
curl -i -X POST https://demo.dspace.org/server/api/workflow/claimedtasks
\ -H "Content-Type:text/uri-list" \
--data "https://demo.dspace.org/server/api/workflow/pooltasks/1"
```

Return codes:
201 Created - if the operation succeed
401 Unauthorized - if you are not authenticated
403 Forbidden -  if the loggedin user is not the reviewer of the pooltask
422 Unprocessable Entity - if the pooltask provided doesn't exist
