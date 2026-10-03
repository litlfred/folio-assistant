---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-044-element
section_title: "Element"
section_number: null
pages: 27-27
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Description
The CreationInfo provides information about who created the Element, and when and how it was created.
The dateTime created is often the date of last change (e.g., a git commit date), not the date when the SPDX data was created, as
doing so supports reproducible builds.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/CreationInfo
Name:
CreationInfo
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
created
DateTime
1
1
createdBy
Agent
1
*
createdUsing
Tool
0
*
specVersion
SemVer
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
created
DateTime
1
1
createdBy
Agent
1
*
createdUsing
Tool
0
*
specVersion
SemVer
1
1
8.1.7
