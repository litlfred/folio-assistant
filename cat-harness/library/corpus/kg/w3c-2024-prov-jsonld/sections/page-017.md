---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-017
section_title: "Page 17"
pages: 17-17
pdf_page: 17
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
In the Schema for prov:Association, an association MUST contain a property @type with value
Association. It SHOULD contain an activity (property activity, see PROV-DM activity) and its
associated agent (property agent, see PROV-DM agent). It MAY contain an identifier (property @id), a
plan (property plan, see PROV-DM plan), a location (property location, see PROV-DM prov:location),
a role (property role, see PROV-DM prov:role), further type information (property type, see PROV-
DM prov:type), a label (property label, see PROV-DM prov:label), or other properties with an explicit
prefix (see PROV-DM association attributes).
Schema for prov:Association
{
"prov:Association": {
"type": "object",
"required": [
"@type"
],
"properties": {
"@type":      { "pattern": "Association" },
"@id":        { "$ref": "#/definitions/Qual
"activity":   { "$ref": "#/definitions/Qual
"agent" :     { "$ref": "#/definitions/Qual
"plan" :      { "$ref": "#/definitions/Qual
"type":       { "$ref": "#/definitions/Arra
"role":       { "$ref": "#/definitions/Arra
"label":      { "$ref": "#/definitions/Arra
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/defini
},
"additionalProperties": false
}
}
§ 4.7 prov:Association
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
17/71
