---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s105-post-method-single-resource-level
section_title: "POST Method (single resource level)"
file: "claimedtasks.md"
lines: 109-121
source_sha256: bffc31e318cbb41a
granularity: heading
---
## POST Method (single resource level)
To perform a claimed task a POST request must be issued against the single claimed task URL
/api/workflow/claimedtasks/:id
using http request parameters to instruct the workflow action class about the specific command to perform approve, reject, add a score, etc. In some case other parameters must be specified too as for instance the reason parameter for the reject action

| action | command options | parameter to trigger the command | additional parameters |
| --- | --- | --- | --- |
| editaction | approve | submit\_approve=true | _none_ |
| editaction | reject | submit\_reject=true | reason=<text to send to the submitter> |
| finaleditaction | approve | submit\_approve=true | _none_ |
| selectrevieweraction | choose a reviewer | submit\_select\_reviewer\_<uuid>=true | no extra parameters needed but the primary parameter name define the selected eperson |
| scorereviewaction |record the score | submit_score=true | score=<int value of the score> |
