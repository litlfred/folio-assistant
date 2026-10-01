---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-021-23-party-class
section_title: "Party Class"
section_number: 2.3
pages: 10-10
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
A Party Class is an entity or a collection of entities that undertake functional roles in a Rule, such as a person, collection of
people, organisation, or agent. An agent is a person or thing that takes an active role or produces a specified effect. The Party
performs (or does not perform) Actions or has a function in a Duty (i.e., assigns the Party to the Rule by associating it with the
function it plays in the Rule).
The Party class has the following properties:
A Party SHOULD have one uid property value (of type IRI [rfc3987]) to identify the Party.
A Party MAY have none, one, or many partOf property values (of type PartyCollection) to identify the PartyCollection that
this Party is a member of.
The Party class has the following subclass:
PartyCollection - a Party that is a single entity representing a set of member entities. This indicates that all the members
of the set will undertake the same functional role in the Rule.
The PartyCollection class has the following properties:
A PartyCollection MAY have one source property value (of type IRI [rfc3987]) to reference the PartyCollection.
A PartyCollection MAY have none, one, or many refinement property values of type Constraint. See Refinement property
with a Party Collection for more details.
The ODRL Information Model does not provide additional metadata for the Party class. It is recommended to use existing
metadata standards, such as the W3C vCard Ontology [vcard-rdf] or FOAF Vocabulary [foaf].
