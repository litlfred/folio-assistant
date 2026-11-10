---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-053-33-odrl-profile-mechanism
section_title: "ODRL Profile Mechanism"
section_number: 3.3
pages: 31-31
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
To create an ODRL Profile, direct extensions to the ODRL Core Vocabulary classes, properties, and instances are defined in the
following way:
ODRL Profile Definition
Example
Additional Policy Subclasses:
Create a subclass of the ODRL Policy class and
define it as disjoint with all other Policy subclasses
(except Set).
ex:myPolicyType rdfs:subClassOf odrl:Policy .
owl:disjointWith :Agreement :Offer, :Privacy, :Request,
:Ticket, :Assertion .
Additional Asset Relationships:
Create a sub-property of the abstract relation
property.
ex:myRelation rdfs:subPropertyOf odrl:relation .
Additional Party Functional roles:
Create a sub-property of the abstract function
property.
ex:myFunctionRole rdfs:subPropertyOf odrl:function .
Additional Actions for Rules:
Create an instance of an Action and define its
includedIn parent Action.
The new Action MAY be defined as includedIn to
any existing Action.
If the new Action forms a dependency with
another new or existing Action, then define the two
actions with the implies property.
ex:myAction a odrl:Action .
ex:myAction odrl:includedIn odrl:use .
ex:myAction odrl:implies odrl:distribute .
Additional Constraint left operands:
Create an instance of the LeftOperand class.
ex:myLeftOperand a odrl:LeftOperand .
Additional Constraint right operands:
Create an instance of the RightOperand class.
ex:myRightOperand a odrl:RightOperand .
Additional Constraint relational operators:
Create an instance of the Operator class.
ex:myOperator a odrl:Operator .
Additional Logical Constraint operands:
Create a sub-property of the abstract operand
property.
ex:myLogicalOp rdfs:subPropertyOf odrl:operand .
Additional Policy Conflict strategies:
Create an instance of the ConflictTerm class.
ex:myStrategy a odrl:ConflictTerm .
Additional Rule class:
Create a subclass of the Rule class and define it as
disjoint with all other Rule subclasses.
ex:myRule rdfs:subClassOf odrl:Rule ;
owl:disjointWith odrl:Prohibition, odrl:Duty, odrl:Permission .
All new classes (rdfs:Class, owl:Class), properties (rdf:Property, owl:ObjectProperty), and instances
(owl:NamedIndividual) must also be defined as a skos:Concept. Appropriate rdfs:domain and rdfs:range should also be
defined for classes.
Human-readable documentation is also recommended for each new term using rdfs:label for the name, skos:definition for
the formal definition, and skos:note for additional comments on its use.
