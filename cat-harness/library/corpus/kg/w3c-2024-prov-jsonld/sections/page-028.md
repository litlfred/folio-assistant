---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-028
section_title: "Page 28"
pages: 28-28
pdf_page: 28
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/defini
},
"additionalProperties": false
}
}
{
"QualifiedName+": {
"$id": "#/definitions/QualifiedName+",
"oneOf": [
{ "$ref": "#/definitions/QualifiedName" },
{
"type": "array",
"items": { "$ref": "#/definitions/Q
}
]
           } 
}
In the Schemas for prov:Bundle and prov:Document, a bundle and a document MUST contain a
property @type with value Bundle and Document respectively, a context @context, and set of PROV
expressions @graph. The names of the properties @context and @graph are specified by JSON-LD
[JSON-LD11]. In addition, a bundle must contain an identifier (property @id).
Schemas for prov:Bundle and prov:Document
{
"prov:Bundle": {
"type": "object",
"required": [
"@type", "@id", "@graph", "@context"
],
"properties": {
"@type":      { "pattern": "Bundle" },
"@id":        { "$ref": "#/definitions/Qual
"@context":   { "$ref": "#/definitions/Cont
§ 4.19 prov:Bundle and prov:Document
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
28/71
