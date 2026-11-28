---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-079-element
section_title: "element"
section_number: null
pages: 45-46
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Description
A definingArtifact property is used to link the Element identifier for an Element defined external to a given SpdxDocument to an
Artifact Element representing the SPDX serialization instance which contains the definition for the Element.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/definingArtifact
Name:
definingArtifact
Nature:
ObjectProperty
Range:
Artifact
Referenced
• /Core/ExternalMap
8.2.15
description
Summary
Provides a detailed description of the Element.
Description
This field is a detailed description of the Element. It may also be extracted from the Element itself.
The intent is to provide recipients of the SPDX file with a detailed technical explanation of the functionality, anticipated use, and
anticipated implementation of the Element.
This field may also include a description of improvements over prior versions of the Element.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/description
Name:
description
Nature:
DataProperty
Range:
xsd:string
Referenced
• /Core/Element
System Package Data Exchange (SPDX©) v3.0
33
8.2.16
element
Summary
Refers to one or more Elements that are part of an ElementCollection.
Description
This field refers to one or more Elements that are part of an ElementCollection.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/element
Name:
element
Nature:
ObjectProperty
Range:
Element
Referenced
• /Core/ElementCollection
8.2.17
