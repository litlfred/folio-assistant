---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-048-29-policy-inheritance
section_title: "Policy Inheritance"
section_number: 2.9
pages: 28-29
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
ODRL supports an inheritance mechanism in which a (child) Policy may inherit all the atomic Rules of one or more (parent)
Policies. The inheritFrom property MUST be used in a child Policy that is inheriting from a parent Policy and MAY include
multiple identifiers of parent Policies.
The following apply when using inheritance:
Inheritance can be to any depth. (Multiple levels of children Policies.)
Inheritance MUST NOT be circular.
No constraint status information is transferred from the parent Policy to the child Policy. That is, if the parent Policy had
status properties with values, then these values would be nulled.
Example Use Case: Consider the (parent) Policy http://example.com/policy:default below. It includes a
(policy-level) assigner and an Obligation to review the target asset policy document.
The child AgreementPolicy http://example.com/policy:4444 below shows the inheritFrom property pointing to the parent
Policy http://example.com/policy:default (above). The child Policy shows the target Asset, the actions (to display the
Asset) and the assignee Party for the Agreement.
After the inheritance is performed - where the parent Policy Rules and Policy-level properties are added to the child Policy - and
the Rules are made atomic - the resulting Policy is shown below. The original child Permission rule now includes the (policy-
    "dc:description": "This policy covers...",
    "dc:issued": "2017-01-01T12:00",
    "dc:coverage": { "@id": "https://www.iso.org/obp/ui/#iso:code:3166:AU-QLD" },
    "dc:replaces": { "@id": "http://example.com/policy:8887" },
    "permission": [ { } ]
}  
EXAMPLE 31
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Policy",
    "uid": "http://example.com/policy:default",
    "profile": "http://example.com/odrl:profile:30",
    "assigner": "http://example.com/org-01",
    "obligation": [{
        "target": "http://example.com/asset:terms-and-conditions",
        "action": "reviewPolicy"
    }]
}  
EXAMPLE 32
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Agreement",
    "uid": "http://example.com/policy:4444",
    "profile": "http://example.com/odrl:profile:30",
    "inheritFrom": "http://example.com/policy:default",
    "assignee": "http://example.com/user:0001",
    "permission": [{
        "target": "http://example.com/asset:5555",
        "action":  "display"
    }]
}  
level) assigner from the parent Policy. The parent Obligation rule now appears in the updated child policy with the original child
(policy-level) assignee.
The ODRL validation requirements for ODRL Policy Inheritance includes:
1. The child Policy MUST access the parent Policy and replicate the following in the updated child Policy:
All policy-level Assets, Parties, Actions from the parent Policy.
All profile identifiers.
Any conflict properties
All Rules from the parent Policy.
2. Repeat the above for each identified parent Policy.
3. The final updated child Policy MAY then be further expanded (into atomic Rules) by following the ODRL validation
requirements defined in the Policy Composition section.
