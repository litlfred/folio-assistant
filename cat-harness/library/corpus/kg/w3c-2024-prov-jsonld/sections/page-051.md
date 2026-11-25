---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-051
section_title: "Page 51"
pages: 51-51
pdf_page: 51
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"items": { "$ref": "#/definitions/lang_string" }
},
"Context": {
"$id": "#/definitions/Context",
"type": "array",
"title": "The @context Schema",
"items": {
"oneOf": [
{
"type": "string",
"format": "uri"
},
{
"type": "object",
"title": "The Items Schema"
"additionalProperties": { "t
}
]
}
},
"prov:StatementOrBundle": {
"oneOf": [
{ "$ref": "#/definitions/prov:Statement" },
{ "$ref": "#/definitions/prov:Bundle" }
]
},
"prov:Statement": {
"oneOf": [
{ "$ref": "#/definitions/prov:Entity" },
{ "$ref": "#/definitions/prov:Activity" },
{ "$ref": "#/definitions/prov:Agent" },
{ "$ref": "#/definitions/prov:Usage" },
{ "$ref": "#/definitions/prov:Generation" }
{ "$ref": "#/definitions/prov:Attribution" }
{ "$ref": "#/definitions/prov:Association" }
{ "$ref": "#/definitions/prov:Delegation" }
{ "$ref": "#/definitions/prov:Invalidation" 
{ "$ref": "#/definitions/prov:Start" },
{ "$ref": "#/definitions/prov:End" },
{ "$ref": "#/definitions/prov:Derivation" }
{ "$ref": "#/definitions/prov:Alternate" },
{ "$ref": "#/definitions/prov:Specialization
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
51/71
