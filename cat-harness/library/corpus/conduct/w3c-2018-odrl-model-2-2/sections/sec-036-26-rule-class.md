---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-036-26-rule-class
section_title: "Rule Class"
section_number: 2.6
pages: 19-19
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
The Rule class is the parent of the Permission, Prohibition, and Duty classes. The Rule class represents the common
characteristics of these three classes. A Rule class MUST be disjoint with all other Rule subclasses.
The Rule class has the following properties:
A Rule MUST have one action property value of type Action.
A Rule MAY have none or one relation sub-property values of type Asset.
A Rule MAY have none, one or many function sub-property values of type Party.
A Rule MAY have none, one or many failure sub-property values of type Rule.
A Rule MAY have none, one or many constraint property values of type Constraint/LogicalConstraint.
A Rule MAY have none or one uid property values (of type IRI [rfc3987]) to identify the Rule so it MAY be referenced by
other Rules.
Note: The above property cardinalities reflect the normative ODRL Information Model. In some cases, repeat occurrences of
some properties are also supported (as described in Policy Rule Composition and Compact Policy) but the normative atomic
Policy is consistent with the above property cardinalities.
Explicit sub-properties of the abstract relation, relation and failure properties must be used, the choice depending on the
subclass of Rule in question.
The three classes of Rules also form important relationships with the Duty Rule. The property relationships are summarised in the
figure below.
Figure 3 ODRL Rule Relationships (Also available in SVG format)
