---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-037-261-permission-class
section_title: "Permission Class"
section_number: 2.6.1
pages: 19-20
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
A Permission allows an action, with all refinements satisfied, to be exercised on an Asset if all constraints are satisfied and if all
duties are fulfilled.
The Permission class is a subclass of, and inherits all the properties from, the Rule class - and has the following additional
property semantics:
A Permission MUST have one target property value of type Asset. (Other relation sub-properties MAY be used.)
A Permission MAY have none or one assigner and/or assignee property values (of type Party) for functional roles. (Other
function sub-properties MAY be used.)
A Permission MAY have none, one, or more duty property values of type Duty.
Note: The above property cardinalities reflect the normative ODRL Information Model. In some cases, repeat occurrences of
some properties are also supported (as described in Policy Rule Composition and Compact Policy) but the normative atomic
Policy is consistent with the above property cardinalities.
The duty property expresses an agreed obligation that MUST be fulfilled. That is, the duty property asserts a pre-condition
between the Permission and the Duty. See the Duty with a Permission section for more details.
Example Use Case: The Policy Offer from assigner http://example.com/org:xyz expresses the play action for the
target Asset http//example.com/game:9090 and the permission is valid until the end of the year 2017.
