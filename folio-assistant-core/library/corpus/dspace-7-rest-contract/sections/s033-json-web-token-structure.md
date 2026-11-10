---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s033-json-web-token-structure
section_title: "JSON Web Token structure"
file: "authentication.md"
lines: 55-63
source_sha256: 5fe6b72a7fccbca6
granularity: heading
---
### JSON Web Token structure
The JWT contains the following claims

claim | description
--- | ---
eid|Contains the id of the eperson
sg | Contains the id's of the special groups to which a user belongs
exp | Contains the expiration date when a token will expire
