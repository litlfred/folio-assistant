---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-028-251-constraint-class
section_title: "Constraint Class"
section_number: 2.5.1
pages: 14-15
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
A Constraint class is used for expressions which compare two operands (which are not Constraints) by one relational operator. If
the comparison returns a match the Constraint is satisfied, otherwise it is not satisfied. The Constraint class formulates a
comparison expression, such as, the number of usages (the leftOperand) must be smaller than (the operator) the number 10
(the rightOperand).
The Constraint class has the following properties:
A Constraint MAY have none or one uid property value (of type IRI [rfc3987]) to identify the Constraint.
A Constraint MUST have one leftOperand property value of type LeftOperand.
A Constraint MUST have one operator property value of type Operator.
A Constraint MUST have either:
one rightOperand property value of type:
literal, or IRI [rfc3987], or RightOperand; or
for set-based operators; list of literals, or list of IRIs [rfc3987], or list of RightOperands;
one rightOperandReference property value of type:
IRI [rfc3987]; or
for set-based operators; list of IRIs [rfc3987];
for a reference to a right operand value.
A Constraint MAY have none or one dataType property value for the data type of the rightOperand/Reference.
A Constraint MAY have none or one unit property value (of type IRI [rfc3987]) to set the unit used for the value of the
rightOperand/Reference.
A Constraint MAY have none or one status property value for a value generated from the leftOperand action or for a value
related to the leftOperand set as the reference for the comparison.
The leftOperand property values are defined as instances of the LeftOperand class. The leftOperand instances MUST clearly
be defined to indicate the semantics of the Constraint, and MAY declare how the value for comparison has to be retrieved or
generated. The ODRL Common Vocabulary [odrl-vocab] defines leftOperand's that MAY be used by ODRL Profiles.
The operator property values are defined as instances of the Operator class. The operator instances identify the relational
operation such as “greater than” or “equal to” between the left and right operands.
The rightOperand property values are defined as instances of the RightOperand class, or IRIs, or Literal values. The
rightOperand is the value of the Constraint that is to be compared to the leftOperand. The rightOperandReference represents
an IRI that MUST be de-referenced first to obtain the actual value of the rightOperand. A rightOperandReference is used in
cases where the value of the rightOperand MUST be obtained from dereferencing an IRI first. Only one of rightOperand or
rightOperandReference MUST appear in the Constraint.
The rightOperand represents a value and the rightOperandReference represents an IRI that must be de-referenced to obtain the
value. If the rightOperand was http://example.com/c100 then that is interpreted as the value to be compared in the
expression. If the rightOperandReference was the same value of http://example.com/c100, then that IRI must be de-
referenced first and the data returned must be interpreted as the value to be compared in the expression.
The dataType indicates the type of the rightOperand/Reference, such as xsd:decimal or xsd:datetime and the unit indicates
the unit value of the rightOperand/Reference, such as “EU currency”.
The status provides a value generated from the leftOperand action that MUST be used in the comparison expression. For
example, a count constraint could have a rightOperand value of 10, and the status of 5. This means that the action has already
been exercised 5 times and the comparison must compare the current action to the status value.
