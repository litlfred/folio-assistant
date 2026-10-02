---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-049
section_title: "Page 49"
pages: 49-49
pdf_page: 49
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
1. The first roundtrip testing is implemented in
https://github.com/lucmoreau/ProvToolbox/blob/ProvToolbox-1.0.0/modules-
core/prov-
jsonld/src/test/java/org/openprovenance/prov/core/RoundTripFromJavaJSONLD11Test
.java
2. The second roundtrip testing is implemented in
https://github.com/lucmoreau/ProvToolbox/blob/ProvToolbox-1.0.0/modules-
legacy/roundtrip/src/test/java/org/openprovenance/prov/core/roundtrip/RoundTripFrom
JavaJSONLD11LegacyTest.java
{
"definitions": {
"DateTime": {
"$id": "#/definitions/DateTime",
"type": "string",
"format": "date-time"
},
"QualifiedName": {
"$id": "#/definitions/QualifiedName",
"type": "string",
"title": "The QualifiedName Schema",
"default": "",
"pattern": "(^[A-Za-z0-9_]+:)?(.*)$"
},
"QualifiedName+": {
"$id": "#/definitions/QualifiedName+",
"oneOf": [
{ "$ref": "#/definitions/QualifiedName" },
{
"type": "array",
"items": { "$ref": "#/definitions/Qu
}
]
},
"non_prov_properties": {
"$id": "#/definitions/non_prov_properties",
"patternProperties": {
§ A. JSON Schema for PROV-JSONLD
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
49/71
