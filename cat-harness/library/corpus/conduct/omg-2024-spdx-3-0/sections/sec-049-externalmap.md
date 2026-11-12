---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-049-externalmap
section_title: "ExternalMap"
section_number: null
pages: 30-31
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
A map of Element identifiers that are used within an SpdxDocument but defined external to that SpdxDocument.
Description
An external map is a map of Element identifiers that are used within an SpdxDocument but defined external to that SpdxDocument.
The external map provides details about the externally-defined Element such as its provenance, where to retrieve it, and how to
verify its integrity.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/ExternalMap
Name:
ExternalMap
Instantiability:
Concrete
Properties
Property
Type
minCount
maxCount
definingArtifact
Artifact
0
1
externalSpdxId
xsd:anyURI
1
1
locationHint
xsd:anyURI
0
1
verifiedUsing
IntegrityMethod
0
*
All properties (informative)
Property
Type
minCount
maxCount
definingArtifact
Artifact
0
1
externalSpdxId
xsd:anyURI
1
1
locationHint
xsd:anyURI
0
1
verifiedUsing
IntegrityMethod
0
*
8.1.12
ExternalRef
Summary
A reference to a resource outside the scope of SPDX-3.0 content related to an Element.
Description
An External Reference points to a general resource outside the scope of the SPDX-3.0 content that provides additional context,
characteristics or related information about an Element.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/ExternalRef
Name:
ExternalRef
Instantiability:
Concrete
18
System Package Data Exchange (SPDX©) v3.0
Properties
Property
Type
minCount
maxCount
comment
xsd:string
0
1
contentType
MediaType
0
1
externalRefType
ExternalRefType
0
1
locator
xsd:string
0
*
All properties (informative)
Property
Type
minCount
maxCount
comment
xsd:string
0
1
contentType
MediaType
0
1
externalRefType
ExternalRefType
0
1
locator
xsd:string
0
*
8.1.13
