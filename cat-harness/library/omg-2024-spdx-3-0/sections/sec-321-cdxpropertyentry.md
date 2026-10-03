---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-321-cdxpropertyentry
section_title: "CdxPropertyEntry"
section_number: null
pages: 175-176
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
1
*
All properties (informative)
Property
Type
minCount
maxCount
cdxProperty
CdxPropertyEntry
1
*
18.1.2
CdxPropertyEntry
Summary
A property name with an associated value.
Description
Each CdxPropertyEntry contains a name-value pair which maps the name to its associated value.
Unlike key-value stores, properties in CdxPropertiesExtension support duplicate names, each potentially having different values.
This class can be used to implement CycloneDX compatible properties.
System Package Data Exchange (SPDX©) v3.0
163
Metadata
