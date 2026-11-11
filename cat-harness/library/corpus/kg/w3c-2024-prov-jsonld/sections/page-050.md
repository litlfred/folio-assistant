---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-050
section_title: "Page 50"
pages: 50-50
pdf_page: 50
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"^[A-Za-z0-9_]+:(.*)$": {}
}
},
"typed_value": {
"type": "object",
"required": [ "@value", "@type"],
"properties": {
"@value": {
"type": "string"
},
"@type": {
"type": "string"
}
},
"additionalProperties": false
},
"lang_string": {
"type": "object",
"required": [ "@value" ],
"properties": {
"@value": {
"type": "string"
},
"@language": {
"type": "string"
}
},
"additionalProperties": false
},
"ArrayOfValues": {
"$id": "#/definitions/ArrayOfValues",
"type": "array",
"items": {
"anyOf": [
{ "$ref": "#/definitions/QualifiedNa
{ "$ref": "#/definitions/typed_value
{ "$ref": "#/definitions/lang_string
]
}
},
"ArrayOfLabelValues": {
"$id": "#/definitions/ArrayOfLabelValues",
"type": "array",
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
50/71
