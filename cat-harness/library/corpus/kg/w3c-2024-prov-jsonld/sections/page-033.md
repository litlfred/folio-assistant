---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-033
section_title: "Page 33"
pages: 33-33
pdf_page: 33
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
prov:agent
prov:qualifiedDelegation
prov:actedOnBehalfOf
Delegation
j)
prov:agent
prov:qualifiedAssociation
prov:wasAssociatedWith
prov:agent
prov:qualifiedAttribution
Entity
Attribution
prov:wasAttributedTo
Activity
prov:hadRole
Role
Plan
prov:hadPlan
Association
Agent
Agent
Agent
Agent
Figure 2 (taken from [PROV-O]): Illustration of the properties and classes to use (in blue) to qualify
the binary influence relations (dotted black). The diagram depict entities as ovals, activities as
rectangles, and agents as pentagons. The Qualified Resource is represented as a left-pointy shape: in
PROV-JSONLD, a Qualified Resource is represented as a JSON Object.
The following JSON properties have a default meaning, unless they are redefined in a specific context
of a PROV-JSONLD document: entity, activity and agent respectively map to PROV-O object
properties prov:entity, prov:activity and prov:agent.
{
"entity": {
    "@id": "prov:entity",
    "@type": "@id"
},
"activity": {
    "@id": "prov:activity",
    "@type": "@id"
},
"agent": {
    "@id": "prov:agent",
    "@type": "@id"
}
}
§ 5.2 Default and generic Context Elements
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
33/71
