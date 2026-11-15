---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-027-25-constraints
section_title: "Constraints"
section_number: 2.5
pages: 12-14
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
An Action (except for use and transfer) MUST have one includedIn property value (of type Action) to transitively assert
this Action that encompasses its operational semantics.
EXAMPLE 10
{
   "@type": "vcard:Individual",
   "@id": "http://example.com/person/murphy",
   "vcard:fn": "Murphy",
   "vcard:hasEmail": "murphy@example.com",
   ...
   "odrl:partOf": "http://example.com/team/A",
   ...
}
EXAMPLE 11
{
   "@type": "vcard:Individual",
   "@id": "http://example.com/person/billie",
   "vcard:fn": "Billie",
   "vcard:hasEmail": "billie@example.com",
   ...
   "odrl:assigneeOf": "http://example.com/policy:1011",
   ...
}
An Action MAY have none, one or more implies property values (of type Action) to assert this Action is not prohibited to
enable its operational semantics.
Action terms MUST be defined using the includedIn property referring to an encompassing Action and either use or transfer
as the top-level parent term by transitive means. The purpose of the includedIn property is to explicitly assert that the semantics
of the referenced instance of an other Action encompasses (includes) the semantics of this instance of Action. The includedIn
property is transitive, and as such, the Actions form ancestor relationships.
The implication of the includedIn property is that a Permission or Prohibition of an encompassing Action is inherited by all
Actions with an includedIn relationship. For example, if the play Action is defined as includedIn with use then if play is
permitted in a Policy and use is prohibited in the same Policy - and both Actions apply to the same target Asset - then because of
this asserted relationship between the two, there is conflict in the Policy. (See Policy Conflict Strategy for more details.)
The implies property asserts that an instance of Action entails that the other instance of Action is not prohibited. The implies
property can establish such an assertion between two Action instances if they don't have an includedIn relationship. For
example, if a share Action implies explicitly the distribute Action, then if share is permitted in a Policy and distribute is
prohibited in the same Policy - and both Actions apply to the same target Asset - this would cause a conflict in the Policy. If an
implied other action is not prohibited then this will not cause a conflict. (See Policy Conflict Strategy for more details.)
See ODRL Profiles for usage details on the includedIn and implies properties.
The ODRL Common Vocabulary [odrl-vocab] defines a standard set of generic Actions that MAY be adopted by ODRL Profiles.
Example Use Case: The Policy expresses an Offer for the target Asset http://example.com/music:1012 with the
Action to play the Asset (play is defined as an includedIn term of use).
2.5 Constraints
Constraints are boolean/logical expressions that can be used to refine the semantics of an Action and Party/Asset Collection or
declare the conditions applicable to a Rule. Constraints can be represented as a Constraint class or Logical Constraint class. A
Logical Constraint will refer to existing Constraints as its operands. When multiple Constraints apply to the same Rule, Action,
Party/Asset Collection, then they are interpreted as conjunction and all MUST be satisfied.
The Constraint and Logical Constraint classes form semantic and conditional relationships with the Party Collection, Asset
Collection, Action, and Rule classes. The property relationships are summarised in the figure below.
EXAMPLE 12
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Offer",
    "uid": "http://example.com/policy:1012",
    "profile": "http://example.com/odrl:profile:06",
    "permission": [{
            "target": "http://example.com/music:1012",
            "assigner": "http://example.com/org:abc",
            "action": "play"
     }]
}
Figure 2 ODRL Constraint Relationships (Also available in SVG format)
