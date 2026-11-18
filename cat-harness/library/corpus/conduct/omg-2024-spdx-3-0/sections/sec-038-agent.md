---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-038-agent
section_title: "Agent"
section_number: null
pages: 23-23
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Agent represents anything with the potential to act on a system.
Description
The Agent class represents anything that has the potential to act on a system.
This could be a person, organization, software agent, etc.
This is not to be confused with tools that are used to perform tasks.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/Agent
Name:
Agent
Instantiability:
Concrete
SubclassOf:
Element
Superclasses
• /Core/Element
All properties (informative)
Property
Type
minCount
maxCount
comment
xsd:string
0
1
creationInfo
CreationInfo
1
1
description
xsd:string
0
1
extension
/Extension/Extension
0
*
externalIdentifier
ExternalIdentifier
0
*
externalRef
ExternalRef
0
*
name
xsd:string
0
1
spdxId
xsd:anyURI
1
1
summary
xsd:string
0
1
verifiedUsing
IntegrityMethod
0
*
8.1.2
