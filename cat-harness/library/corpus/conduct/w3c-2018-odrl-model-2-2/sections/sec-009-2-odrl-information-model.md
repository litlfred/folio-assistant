---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-009-2-odrl-information-model
section_title: "ODRL Information Model"
section_number: 2
pages: 3-5
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
describing content usage. The information model covers the core concepts, entities and relationships that provide the foundational
model for content usage statements. These machine-readable policies may be linked directly with the content they are associated
to with the aim to allow consumers to easily retrieve this information.
1.1 Aims of the Model
The primary aim of the ODRL Information Model is to provide a standard description model and format to express permission,
prohibition, and obligation statements to be associated to content in general. These statements are employed to describe the terms
of use and reuse of resources. The model should cover as many permission, prohibition, and obligation use cases as possible,
while keeping the policy modelling easy even when dealing with complex cases.
The ODRL Information Model is a single, consistent model that can be used by all interested parties. A single method of fulfilling
a use case is strongly preferred over multiple methods, unless there are existing standards that need to be accommodated or there
is a significant cost associated with using only a single method. While the ODRL Information Model is built using Linked Data
principles, the design is intended to allow non-graph-based implementations.
1.2 Conformance
As well as sections marked as non-normative, all authoring guidelines, diagrams, examples, and notes in this specification are
non-normative. Everything else in this specification is normative.
The key words MAY, MUST, MUST NOT, RECOMMENDED, SHOULD, and SHOULD NOT are to be interpreted as described in
[RFC2119].
The examples throughout the document are serialized as [json-ld]. For normative serialisations, including the JSON context,
please refer to the ODRL Vocabulary and Expression [odrl-vocab].
1.3 Terminology
Policy
A group of one or more Rules
Rule
An abstract concept that represents the common characteristics of Permissions, Prohibitions, and Duties.
Action
An operation on an Asset
Permission
The ability to exercise an Action over an Asset
Prohibition
The inability to exercise an Action over an Asset
Duty
The obligation to exercise an agreed Action.
Asset
A resource or a collection of resources that are the subject of a Rule
Party
An entity or a collection of entities that undertake Roles in a Rule
Constraint
A boolean/logical expression that refines an Action and Party/Asset collection or the conditions applicable to a Rule.
ODRL Validator
A system that checks the conformance of ODRL Policy expressions, including the cardinality of properties and if they are
related to types of values as defined by the ODRL Information Model, and the Information Model's validation
requirements.
ODRL Evaluator
A system that determines whether the Rules of an ODRL Policy expression have meet their intended action performance.
ODRL Core Vocabulary
The set of terms that are represented by the ODRL Information Model.
ODRL Profile
A community or sector specific vocabulary that extends the ODRL Core Vocabulary with new terms to express Policies
ODRL Common Vocabulary
A set of generic terms that may be re-used by ODRL Profiles.
2. ODRL Information Model
The ODRL Information Model represents Policies that express Permissions, Prohibitions and Duties related to the usage of Asset
resources. The Information Model explicitly expresses what is allowed and what is not allowed by the Policy, as well as other
terms, requirements, and parties involved. The aim of the ODRL Information Model is to enable flexible Policy expressions by
allowing the policy author to include as much, or as little, detail in the Policies.
The figure below shows the ODRL Information Model.
Figure 1 ODRL Information Model (Also available in SVG format)
The ODRL Information Model has the following classes:
Policy - A non-empty group of Permissions (via the permission property) and/or Prohibitions (via the prohibition property)
and/or Duties (via the obligation property). The Policy class is the parent class to the Set, Offer, and Agreement subclasses:
Set - a subclass of Policy that supports expressing generic Rules.
Offer - a subclass of Policy that supports offerings of Rules from assigner Parties.
Agreement - a subclass of Policy that supports granting of Rules from assigner to assignee Parties.
Asset - A resource or a collection of resources that are the subject of a Rule (via the abstract relation property). The Asset
class is the parent class to:
AssetCollection - a subclass of Asset that identifies a collection of resources.
Party - An entity or a collection of entities that undertake Roles in a Rule (via the abstract function property). The Party
class is the parent class to:
PartyCollection - a subclass of Party that identifies a collection of entities.
Action - An operation on an Asset.
Rule - An abstract concept that represents the common characteristics of Permissions, Prohibitions, and Duties.
Permission - The ability to exercise an Action over an Asset. The Permission MAY also have the duty property that
expresses an agreed Action that MUST be exercised (as a pre-condition to be granted the Permission).
Prohibition - The inability to exercise an Action over an Asset.
Duty - The obligation to exercise an Action.
Constraint/LogicalConstraint - A boolean/logical expression that refines an Action and Party/Asset collection or the
conditions applicable to a Rule.
The ODRL Information Model includes property relationships between the classes. Most are explicitly named properties and
some are abstract properties (specifically, relation, function, operand, and failure). The abstract properties are generic parent
properties that are designed to be represented by child properties (sub-types) with explicit semantics.
For example, the two properties relation and function in Figure 1 are designed to represent the conceptual relation between the
Rule and the Asset and Party classes. The figure shows the relation property with subtype target to express that the Asset is the
primary subject of the Rule. The function property has subtype assigner to express the Party issuing the Rule, and subtype
assignee to express the recipient Party of the Rule.
The following sections provide further details on the ODRL Information Model.
