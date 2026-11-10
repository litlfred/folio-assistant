---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-029-252-logical-constraint-class
section_title: "Logical Constraint Class"
section_number: 2.5.2
pages: 15-15
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
A Logical Constraint class is used for expressions which compare two or more operands which are existing Constraints by one
logical operator. If the comparison returns a logical match, then the Logical Constraint is satisfied, otherwise it is not satisfied.
For example, three Constraints could be logically and-ed indicating that all three must be true for the Logical Constraint to be
satisfied.
The Logical Constraint class has the following properties:
A Logical Constraint MAY have none or one uid property value (of type IRI [rfc3987]) to identify the Logical Constraint.
A Logical Constraint MUST have one operand sub-property indicating the logical relationship of the compared existing
constraints; its value is a list of the existing Constraint instances.
An ODRL evaluator MUST support the following sub-properties of operand:
or - at least one of the Constraints MUST be satisfied
xone - only one, and not more, of the Constraints MUST be satisfied
and - all of the Constraints MUST be satisfied
andSequence - all of the Constraints - in sequence - MUST be satisfied
Additional operand sub-properties MAY be defined by ODRL Profiles.
The ODRL validation requirements for Logical Constraints includes:
1. The operand MUST only be of the sub-properties; or, xone, and, andSequence. Additional sub-properties of operand MAY
be defined by ODRL Profiles exclusively for the use of Logical Constraints.
2. All of the operand values MUST be unique Constraint instances.
The Constraint instances MUST be evaluated and the outcomes used to determine if the logical relationship is satisfied (based on
the semantics of the operand sub-property).
