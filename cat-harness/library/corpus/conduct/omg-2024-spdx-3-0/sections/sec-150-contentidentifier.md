---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-150-contentidentifier
section_title: "contentIdentifier"
section_number: null
pages: 79-80
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
ContentIdentifier
0
*
copyrightText
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
originatedBy
Agent
0
*
primaryPurpose
SoftwarePurpose
0
1
releaseTime
DateTime
0
1
spdxId
xsd:anyURI
1
1
standardName
xsd:string
0
*
summary
xsd:string
0
1
suppliedBy
Agent
0
1
supportLevel
SupportType
0
*
validUntilTime
DateTime
0
1
verifiedUsing
IntegrityMethod
0
*
9.2
Properties
9.2.1
additionalPurpose
Summary
Provides additional purpose information of the software artifact.
Description
An additionalPurpose provides information about the additional purpose of the software artifact in addition to the primaryPurpose.
Metadata
https://spdx.org/rdf/3.0.1/terms/Software/additionalPurpose
Name:
additionalPurpose
Nature:
ObjectProperty
Range:
SoftwarePurpose
Referenced
• /Software/SoftwareArtifact
9.2.2
attributionText
Summary
Provides a place for the SPDX data creator to record acknowledgement text for a software Package, File or Snippet.
Description
An attributionText for a software Package, File or Snippet provides a consumer of SPDX data with acknowledgement content, to
assist redistributors of the Package, File or Snippet with reproducing those acknowledgements.
For example, this field may include a statement that is required by a particular license to be reproduced in end-user documentation,
advertising materials, or another form.
This field may describe where, or in which contexts, the acknowledgements need to be reproduced, but it is not required to do so.
The SPDX data creator may also explain elsewhere (such as in a comment field) how they intend for data in this field to be used.
System Package Data Exchange (SPDX©) v3.0
67
An attributionText is not meant to include the software Package, File or Snippet’s actual complete license text. Use hasConclud-
edLicense to identify the corresponding license.
Metadata
https://spdx.org/rdf/3.0.1/terms/Software/attributionText
Name:
attributionText
Nature:
DataProperty
Range:
xsd:string
Referenced
• /Software/SoftwareArtifact
9.2.3
