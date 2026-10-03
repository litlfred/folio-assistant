---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-025-233-assigned-policy-properties
section_title: "Assigned Policy Properties"
section_number: 2.3.3
pages: 12-12
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
An ODRL Policy class MAY also be referenced by the assignerOf and assigneeOf properties. This supports ODRL Policy Rules
being the object of external metadata expressions (that identifies a Party). When assignerOf has been asserted between a
metadata expression and an ODRL Policy, the Party being identified MUST be inferred to undertake the assigner functional role
of all the Rules of that Policy. When assigneeOf has been asserted between a metadata expression and an ODRL Policy, the
Party being identified MUST be inferred to undertake the assignee functional role of all the Rules of that Policy. If there are
multiple Rules in the Policy, then the inferred Party will undertake the functional role to every Rule in the Policy.
Example Use Case: The below snippet shows some vCard metadata describing an individual Party. The
odrl:assigneeOf property links to the ODRL Policy http://example.com/policy:1011 (this is the Offer Policy
described above). In this case, the Party http://example.com/person/billie is now also the assignee of the
Permission in Policy http://example.com/policy:1011. If there were additional Rules in this Policy, then the
same Party would be the assignee for each Rule.
