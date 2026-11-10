---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-048-externalref
section_title: "ExternalRef"
section_number: null
pages: 29-30
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
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
8.1.10
ExternalIdentifier
Summary
A reference to a resource identifier defined outside the scope of SPDX-3.0 content that uniquely identifies an Element.
Description
An ExternalIdentifier is a reference to a resource outside the scope of SPDX-3.0 content that provides a unique key within an
established domain that can uniquely identify an Element.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/ExternalIdentifier
Name:
ExternalIdentifier
Instantiability:
Concrete
Properties
Property
Type
minCount
maxCount
comment
xsd:string
0
1
externalIdentifierType
ExternalIdentifierType
1
1
identifier
xsd:string
1
1
identifierLocator
xsd:anyURI
0
*
issuingAuthority
xsd:string
0
1
System Package Data Exchange (SPDX©) v3.0
17
All properties (informative)
Property
Type
minCount
maxCount
comment
xsd:string
0
1
externalIdentifierType
ExternalIdentifierType
1
1
identifier
xsd:string
1
1
identifierLocator
xsd:anyURI
0
*
issuingAuthority
xsd:string
0
1
8.1.11
