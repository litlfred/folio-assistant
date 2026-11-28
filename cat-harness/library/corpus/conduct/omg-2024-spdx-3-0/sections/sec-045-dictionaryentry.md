---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-045-dictionaryentry
section_title: "DictionaryEntry"
section_number: null
pages: 27-28
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
A key with an associated value.
Description
The class used for implementing a generic string mapping (also known as associative array, dictionary, or hash map) in SPDX.
Each DictionaryEntry contains a key-value pair which maps the key to its associated value.
To implement a dictionary, this class is to be used in a collection with unique keys.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/DictionaryEntry
Name:
DictionaryEntry
Instantiability:
Concrete
Properties
Property
Type
minCount
maxCount
key
xsd:string
1
1
value
xsd:string
0
1
All properties (informative)
Property
Type
minCount
maxCount
key
xsd:string
1
1
value
xsd:string
0
1
System Package Data Exchange (SPDX©) v3.0
15
8.1.8
Element
Summary
Base domain class from which all other SPDX-3.0 domain classes derive.
Description
An Element is a representation of a fundamental concept either directly inherent to the Bill of Materials (BOM) domain or indirectly
related to the BOM domain and necessary for contextually characterizing BOM concepts and relationships. Within SPDX-3.0
structure this is the base class acting as a consistent, unifying, and interoperable foundation for all explicit and inter-relatable
content objects.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/Element
Name:
Element
Instantiability:
Abstract
Properties
Property
Type
minCount
maxCount
comment
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
