---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s592-submission-deposit
section_title: "Submission / Deposit"
file: "submission.md"
lines: 1-12
source_sha256: d5948e40a87939fd
granularity: heading
---
# Submission / Deposit
[REST Overview Documentation](README.md)

One of the most used features in DSpace is the submission/workflow process.

Because of its configurability, many different REST endpoints are used during this process.
This page helps provide an overview of how to submit a new Item into DSpace.

**NOTE: All the activities below require authentication and a valid CSRF token.**
* Don't forget to include the "Authorization" header in every request! See [Authentication](authentication.md).
* Don't forget to include the CSRF token in every request! See [CSRF Tokens](csrf-tokens.md).
