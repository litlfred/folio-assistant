---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s225-single-eperson-registration
section_title: "Single EPerson registration"
file: "epersonregistrations.md"
lines: 9-12
source_sha256: 1c3d12225c2a3062
granularity: heading
---
## Single EPerson registration

As we don't have a use case to retrieve an eperson registration based on the email, the single endpoint is not implemented and a 405 error code is returned according to our [general error response codes](README.md#Error-codes).
