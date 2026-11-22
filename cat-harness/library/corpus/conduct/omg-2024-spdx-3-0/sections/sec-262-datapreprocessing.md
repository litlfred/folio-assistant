---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-262-datapreprocessing
section_title: "dataPreprocessing"
section_number: null
pages: 145-147
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
xsd:string
0
*
datasetAvailability
DatasetAvailabilityType
0
1
datasetNoise
xsd:string
0
1
datasetSize
xsd:nonNegativeInteger
0
1
datasetType
DatasetType
1
*
datasetUpdateMechanism
xsd:string
0
1
description
xsd:string
0
1
downloadLocation
xsd:anyURI
1
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
hasSensitivePersonalInformation
/Core/PresenceType
0
1
homePage
xsd:anyURI
0
1
intendedUse
xsd:string
0
1
knownBias
xsd:string
0
*
name
xsd:string
1
1
originatedBy
Agent
1
1
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
1
1
releaseTime
DateTime
1
1
sensor
/Core/DictionaryEntry
0
*
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
14.2
Properties
14.2.1
anonymizationMethodUsed
Summary
Describes the anonymization methods used.
Description
A free-form text that describes the methods used to anonymize the dataset or fields in the dataset.
Metadata
https://spdx.org/rdf/3.0.1/terms/Dataset/anonymizationMethodUsed
Name:
anonymizationMethodUsed
Nature:
DataProperty
Range:
xsd:string
System Package Data Exchange (SPDX©) v3.0
133
Referenced
• /Dataset/DatasetPackage
14.2.2
confidentialityLevel
Summary
Describes the confidentiality level of the data points contained in the dataset.
Description
Describes the levels of confidentiality of the data points contained in the dataset.
Metadata
https://spdx.org/rdf/3.0.1/terms/Dataset/confidentialityLevel
Name:
confidentialityLevel
Nature:
ObjectProperty
Range:
ConfidentialityLevelType
Referenced
• /Dataset/DatasetPackage
14.2.3
dataCollectionProcess
Summary
Describes how the dataset was collected.
Description
A free-form text that describes how a dataset was collected.
Examples include the sources from which a dataset was scrapped and the interview protocol that was used for data collection.
Metadata
https://spdx.org/rdf/3.0.1/terms/Dataset/dataCollectionProcess
Name:
dataCollectionProcess
Nature:
DataProperty
Range:
xsd:string
Referenced
• /Dataset/DatasetPackage
14.2.4
dataPreprocessing
Summary
Describes the preprocessing steps that were applied to the raw data to create the given dataset.
Description
A free-form text that describes the various preprocessing steps that were applied to the raw data to create the dataset.
Examples include standardization, normalization, deduplication, tokenization, and removal of tokens.
Metadata
https://spdx.org/rdf/3.0.1/terms/Dataset/dataPreprocessing
Name:
dataPreprocessing
Nature:
DataProperty
Range:
xsd:string
134
System Package Data Exchange (SPDX©) v3.0
Referenced
• /Dataset/DatasetPackage
14.2.5
