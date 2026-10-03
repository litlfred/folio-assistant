---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-143-package
section_title: "Package"
section_number: null
pages: 73-76
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
61
Metadata
https://spdx.org/rdf/3.0.1/terms/Software/File
Name:
File
Instantiability:
Concrete
SubclassOf:
/Software/SoftwareArtifact
Superclasses
• /Software/SoftwareArtifact
• /Core/Artifact
• /Core/Element
Properties
Property
Type
minCount
maxCount
/Core/contentType
/Core/MediaType
0
1
fileKind
FileKindType
0
1
External properties cardinality updates
Property
minCount
maxCount
/Core/Element/name
1
All properties (informative)
Property
Type
minCount
maxCount
additionalPurpose
SoftwarePurpose
0
*
attributionText
xsd:string
0
*
builtTime
DateTime
0
1
comment
xsd:string
0
1
contentIdentifier
ContentIdentifier
0
*
contentType
/Core/MediaType
0
1
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
fileKind
FileKindType
0
1
name
xsd:string
1
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
9.1.3
Package
Summary
Refers to any unit of content that can be associated with a distribution of software.
Description
A package refers to any unit of content that can be associated with a distribution of software.
Typically, a package is composed of one or more files.
62
System Package Data Exchange (SPDX©) v3.0
Any of the following non-limiting examples may be (but are not required to be) represented in SPDX as a package:
• a tarball, zip file or other archive
• a directory or sub-directory
• a separately distributed piece of software which another Package or File uses or depends upon (e.g., a Python package, a Go
module, …)
• a container image, and/or each image layer within a container image
• a collection of one or more sub-packages
• a Git repository snapshot from a particular point in time
Note that some of these could be represented in SPDX as a file as well.
Metadata
https://spdx.org/rdf/3.0.1/terms/Software/Package
Name:
Package
Instantiability:
Concrete
SubclassOf:
/Software/SoftwareArtifact
Superclasses
• /Software/SoftwareArtifact
• /Core/Artifact
• /Core/Element
Properties
Property
Type
minCount
maxCount
downloadLocation
xsd:anyURI
0
1
homePage
xsd:anyURI
0
1
packageUrl
xsd:anyURI
0
1
packageVersion
xsd:string
0
1
sourceInfo
xsd:string
0
1
External properties cardinality updates
Property
minCount
maxCount
/Core/Element/name
1
System Package Data Exchange (SPDX©) v3.0
63
All properties (informative)
Property
Type
minCount
maxCount
additionalPurpose
SoftwarePurpose
0
*
attributionText
xsd:string
0
*
builtTime
DateTime
0
1
comment
xsd:string
0
1
contentIdentifier
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
downloadLocation
xsd:anyURI
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
homePage
xsd:anyURI
0
1
name
xsd:string
1
1
originatedBy
Agent
0
*
packageUrl
xsd:anyURI
0
1
packageVersion
xsd:string
0
1
primaryPurpose
SoftwarePurpose
0
1
releaseTime
DateTime
0
1
sourceInfo
xsd:string
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
9.1.4
