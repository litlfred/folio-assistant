---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-144-sbom
section_title: "Sbom"
section_number: null
pages: 76-77
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
A collection of SPDX Elements describing a single package.
Description
A Software Bill of Materials (SBOM) is a collection of SPDX Elements describing a single package.
This could include details of the content and composition of the product, provenance details of the product and/or its composition,
licensing information, known quality or security issues, etc.
Metadata
https://spdx.org/rdf/3.0.1/terms/Software/Sbom
Name:
Sbom
Instantiability:
Concrete
SubclassOf:
/Core/Bom
Superclasses
• /Core/Bom
• /Core/Bundle
• /Core/ElementCollection
• /Core/Element
Properties
Property
Type
minCount
maxCount
sbomType
SbomType
0
*
64
System Package Data Exchange (SPDX©) v3.0
All properties (informative)
Property
Type
minCount
maxCount
comment
xsd:string
0
1
context
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
element
Element
0
*
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
profileConformance
ProfileIdentifierType
0
*
rootElement
Element
0
*
sbomType
SbomType
0
*
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
9.1.5
