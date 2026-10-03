---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-039-annotation
section_title: "Annotation"
section_number: null
pages: 23-24
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
An assertion made in relation to one or more elements.
Description
An Annotation is an assertion made in relation to one or more elements.
The contentType property describes the format of the statement property.
System Package Data Exchange (SPDX©) v3.0
11
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/Annotation
Name:
Annotation
Instantiability:
Concrete
SubclassOf:
Element
Superclasses
• /Core/Element
Properties
Property
Type
minCount
maxCount
annotationType
AnnotationType
1
1
contentType
MediaType
0
1
statement
xsd:string
0
1
subject
Element
1
1
All properties (informative)
Property
Type
minCount
maxCount
annotationType
AnnotationType
1
1
comment
xsd:string
0
1
contentType
MediaType
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
statement
xsd:string
0
1
subject
Element
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
8.1.3
