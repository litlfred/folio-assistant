---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-278-classes
section_title: "Classes"
section_number: null
pages: 153-154
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
15.1.1
AIPackage
Summary
Specifies an AI package and its associated information.
Description
Metadata information that can be added to a package to describe an AI application or trained AI model.
Metadata
https://spdx.org/rdf/3.0.1/terms/AI/AIPackage
Name:
AIPackage
Instantiability:
Concrete
SubclassOf:
/Software/Package
Superclasses
• /Software/Package
• /Software/SoftwareArtifact
• /Core/Artifact
• /Core/Element
System Package Data Exchange (SPDX©) v3.0
141
Properties
Property
Type
minCount
maxCount
autonomyType
/Core/PresenceType
0
1
domain
xsd:string
0
*
