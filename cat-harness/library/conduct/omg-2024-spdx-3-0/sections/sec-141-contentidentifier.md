---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-141-contentidentifier
section_title: "ContentIdentifier"
section_number: null
pages: 73-73
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
A canonical, unique, immutable identifier
Description
A ContentIdentifier is a canonical, unique, immutable identifier of the content of a software artifact, such as a package, a file, or a
snippet.
It can be used for verifying its identity and integrity.
Metadata
https://spdx.org/rdf/3.0.1/terms/Software/ContentIdentifier
Name:
ContentIdentifier
Instantiability:
Concrete
SubclassOf:
/Core/IntegrityMethod
Superclasses
• /Core/IntegrityMethod
Properties
Property
Type
minCount
maxCount
contentIdentifierType
ContentIdentifierType
1
1
contentIdentifierValue
xsd:anyURI
1
1
All properties (informative)
Property
Type
minCount
maxCount
comment
xsd:string
0
1
contentIdentifierType
ContentIdentifierType
1
1
contentIdentifierValue
xsd:anyURI
1
1
9.1.2
