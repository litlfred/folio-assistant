---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s263-creating-a-feedback
section_title: "Creating a feedback"
file: "feedbacks.md"
lines: 17-36
source_sha256: be636cc708c115dc
granularity: heading
---
## Creating a feedback
**POST /api/tools/feedbacks**

Request body:
```json
{
  "e-mail": "myemail@test.com",
  "message": "DSpace is the best!",
  "page": "/home"
}
```

The json body must be valid that mean
- e-mail must be provided
- message must be provided

Return codes:
* 201 Created - if the operation succeed
* 400 Bad Request - if some of the fields e-mail or message is missing
* 404 Not found - if the property 'feedback.recipient' is not configured
