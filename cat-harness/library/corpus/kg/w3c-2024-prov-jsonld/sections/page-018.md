---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-018
section_title: "Page 18"
pages: 18-18
pdf_page: 18
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
In the Schema for prov:Delegation, a delegation MUST contain a property @type with value
Delegation. It SHOULD contain a delegate agent (property delegate, see PROV-DM delegate) and a
responsible agent (property responsible, see PROV-DM responsible). It MAY contain an identifier
(property @id), an activity (property activity, see PROV-DM activity), further type information
(property type, see PROV-DM prov:type), a label (property label, see PROV-DM prov:label), or other
properties with an explicit prefix (see PROV-DM delegation attributes).
Schema for prov:Delegation
{
"prov:Delegation": {
"type": "object",
"required": [
"@type"
],
"properties": {
"@type":      { "pattern": "Delegation" },
"@id":        { "$ref": "#/definitions/Qual
"delegate":   { "$ref": "#/definitions/Qual
"responsible":{ "$ref": "#/definitions/Qual
"activity":   { "$ref": "#/definitions/Qual
"type":       { "$ref": "#/definitions/Arra
"label":      { "$ref": "#/definitions/Arra
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/defini
},
"additionalProperties": false
}
}
§ 4.8 prov:Delegation
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
18/71
