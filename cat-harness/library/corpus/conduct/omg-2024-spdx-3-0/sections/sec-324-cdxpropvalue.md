---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-324-cdxpropvalue
section_title: "cdxPropValue"
section_number: null
pages: 176-178
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
xsd:string
0
1
All properties (informative)
Property
Type
minCount
maxCount
cdxPropName
xsd:string
1
1
cdxPropValue
xsd:string
0
1
18.1.3
Extension
Summary
A characterization of some aspect of an Element that is associated with the Element in a generalized fashion.
Description
An Extension is a characterization of some aspect of an Element that is associated with the Element in a generalized fashion.
Rather than being associated with a particular Element through the typical use of a purpose-specific object property an Extension
is associated with the Element it characterizes using a single common generalized object property.
This approach serves multiple purposes:
1. Support profile-based extended characterization of Elements. Enables specification and expression of Element characteriza-
tion extensions within any profile and namespace of SPDX without requiring changes to other profiles or namespaces and
without requiring local subclassing of remote classes (which could inhibit ecosystem interoperability in some cases).
2. Support extension of SPDX by adopting individuals or communities with Element characterization details uniquely special-
ized to their particular context. Enables adopting individuals or communities to utilize SPDX expressive capabilities along
with expressing more arcane Element characterization details specific to them and not appropriate for standardization across
SPDX.
3. Support structured capture of expressive solutions for gaps in SPDX coverage from real-world use. Enables adopting indi-
viduals or communities to express Element characterization details they require that are not currently defined in SPDX but
likely should be. Enables a practical pipeline that:
• identifies gaps in SPDX that should be filled,
• expresses solutions to those gaps in a way that allows the identifying adopters to use the extended solutions with SPDX
and does not conflict with current SPDX,
• can be clearly detected among the SPDX content exchange ecosystem,
• provides a clear and structured definition of gap solution that can be used as submission for revision to SPDX standard
Metadata
https://spdx.org/rdf/3.0.1/terms/Extension/Extension
Name:
Extension
Instantiability:
Abstract
18.2
Properties
18.2.1
cdxPropName
Summary
A name used in a CdxPropertyEntry name-value pair.
164
System Package Data Exchange (SPDX©) v3.0
Description
A cdxPropName is used in a CdxPropertyEntry name-value pair.
Unlike key-value stores, properties in CdxPropertiesExtension support duplicate names, each potentially having different values.
Metadata
https://spdx.org/rdf/3.0.1/terms/Extension/cdxPropName
Name:
cdxPropName
Nature:
DataProperty
Range:
xsd:string
Referenced
• /Extension/CdxPropertyEntry
18.2.2
cdxPropValue
Summary
A value used in a CdxPropertyEntry name-value pair.
Description
A cdxPropValue is used in a CdxPropertyEntry name-value pair.
Unlike key-value stores, properties in CdxPropertiesExtension support duplicate names, each potentially having different values.
Metadata
https://spdx.org/rdf/3.0.1/terms/Extension/cdxPropValue
Name:
cdxPropValue
Nature:
DataProperty
Range:
xsd:string
Referenced
• /Extension/CdxPropertyEntry
18.2.3
cdxProperty
Summary
Provides a map of a property names to a values.
Description
This field provides a mapping of a name to a value.
This is intended to be compatible with the CycloneDX property properties.
Unlike key-value stores, properties in CdxPropertiesExtension support duplicate names, each potentially having different values.
Metadata
https://spdx.org/rdf/3.0.1/terms/Extension/cdxProperty
Name:
cdxProperty
Nature:
ObjectProperty
Range:
CdxPropertyEntry
Referenced
• /Extension/CdxPropertiesExtension
System Package Data Exchange (SPDX©) v3.0
165
Annex A
