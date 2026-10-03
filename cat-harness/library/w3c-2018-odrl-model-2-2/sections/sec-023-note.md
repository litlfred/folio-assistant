---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-023-note
section_title: "NOTE"
section_number: null
pages: 10-11
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
If a Party does not assert an identifier using the uid property, then the full implications must be understood, such as the
impact on ODRL Validators and Evaluators of ODRL Policies.
EXAMPLE 8
Example Use Case: The Policy shows an Agreement with two Parties with the functional roles of the assigner and
the assignee. The assigner grants the assignee the use of the target asset. In this case, the assigner is explicitly
declared as a Party as well as a vcard:Organisation and some additional external properties. The assignee is
explicitly declared as a PartyCollection as well as a vcard:Group and some additional external properties. This
implies that all the entities that are identified as http://example.com/team/A will each have the same granted
action
