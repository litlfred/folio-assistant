---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-311-buildtype
section_title: "buildType"
section_number: null
pages: 168-170
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
xsd:anyURI
1
1
configSourceDigest
/Core/Hash
0
*
configSourceEntrypoint
xsd:string
0
*
configSourceUri
xsd:anyURI
0
*
environment
/Core/DictionaryEntry
0
*
parameter
/Core/DictionaryEntry
0
*
All properties (informative)
Property
Type
minCount
maxCount
buildEndTime
/Core/DateTime
0
1
buildId
xsd:string
0
1
buildStartTime
/Core/DateTime
0
1
buildType
xsd:anyURI
1
1
comment
xsd:string
0
1
configSourceDigest
/Core/Hash
0
*
configSourceEntrypoint
xsd:string
0
*
configSourceUri
xsd:anyURI
0
*
creationInfo
CreationInfo
1
1
description
xsd:string
0
1
environment
/Core/DictionaryEntry
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
parameter
/Core/DictionaryEntry
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
16.2
Properties
16.2.1
buildEndTime
Summary
Property that describes the time at which a build stops.
Description
buildEndTime describes the time at which a build stops or finishes.
This value is typically recorded by the builder.
Metadata
https://spdx.org/rdf/3.0.1/terms/Build/buildEndTime
Name:
buildEndTime
Nature:
DataProperty
Range:
/Core/DateTime
Referenced
• /Build/Build
156
System Package Data Exchange (SPDX©) v3.0
16.2.2
buildId
Summary
A buildId is a locally unique identifier used by a builder to identify a unique instance of a build produced by it.
Description
A buildId is a locally unique identifier to identify a unique instance of a build, according to the buildType.
This identifier differs based on build toolchain, platform, or naming convention used by an organization or standard.
Metadata
https://spdx.org/rdf/3.0.1/terms/Build/buildId
Name:
buildId
Nature:
DataProperty
Range:
xsd:string
Referenced
• /Build/Build
16.2.3
buildStartTime
Summary
Property describing the start time of a build.
Description
buildStartTime is the time at which a build is triggered.
The builder typically records this value.
Metadata
https://spdx.org/rdf/3.0.1/terms/Build/buildStartTime
Name:
buildStartTime
Nature:
DataProperty
Range:
/Core/DateTime
Referenced
• /Build/Build
16.2.4
buildType
Summary
A buildType is a hint that is used to indicate the toolchain, platform, or infrastructure that the build was invoked on.
Description
A buildType is an IRI expressing the toolchain, platform, or infrastructure that the build was invoked on.
The buildType is used to interpret the meaning of other build parameters by defining the “type” of build; if the same buildType
is seen in different Build elements, it means they are the same kind of build, but difference instances and possible with different
configurations.
If you are not using a well-known buildType, it should be namespaced to a domain you own to prevent conflicts with other buildType
IRIs.
Examples of a buildType might be:
• A GitHub action workflow
• A step in a GitHub actions pipeline
System Package Data Exchange (SPDX©) v3.0
157
• An invocation of a compiler or other tool
• A script that orchestrates builds at a higher level
Keep in mind that builds can be “nested” using the ancestorOf relationship.
If the buildType IRI is not recognized, it is still possible to inspect other properties of the build, but it may not be possible to derive
deeper meaning from them.
For more information, see the SLSA definition of buildType.
Metadata
https://spdx.org/rdf/3.0.1/terms/Build/buildType
Name:
buildType
Nature:
DataProperty
Range:
xsd:anyURI
Referenced
• /Build/Build
16.2.5
