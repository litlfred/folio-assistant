---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-010-21-policy-class
section_title: "Policy Class"
section_number: 2.1
pages: 5-5
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
The Policy class has the following properties:
A Policy MUST have one uid property value (of type IRI [rfc3987]) to identify the Policy.
A Policy MUST have at least one permission, prohibition, or obligation property values of type Rule. (See the
Permission, Prohibition, and Obligation sections for more details.)
A Policy MAY have none, one, or many profile property values (of type IRI [rfc3987]) to identify the ODRL Profile that
this Policy conforms to. (See the ODRL Profiles section for more details.)
A Policy MAY have none, one, or many inheritFrom property values (of type IRI [rfc3987]) to identify the parent Policy
from which this child Policy inherits from. (See the ODRL Inheritance section for more details.)
A Policy MAY have none or one conflict property values (of type ConflictTerm) for Conflict Strategy Preferences
indicating how to handle Policy conflicts.(See the Policy Conflict Strategy section for more details.)
An ODRL Policy MAY also declare properties which are shared and common to all its Rules. Specifically; action properties,
sub-properties of relation (such as target), and sub-properties of function (such as assigner and assignee). See section
Compact Policy for validation requirements on these shared properties.
An ODRL Policy must either:
Only use terms defined in the ODRL Core Vocabulary [odrl-vocab], or
Use an ODRL Profile that declares the supported vocabulary used by expressions in the Policy.
