---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-015
section_title: "Page 15"
pages: 15-15
pdf_page: 15
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"additionalProperties": false
}
}
In the Schema for prov:Derivation, a derivation MUST contain a property @type with value
Derivation. It SHOULD contain a generated entity (property generatedEntity, see PROV-DM
generatedEntity) and used entity (property usedEntity, see PROV-DM usedEntity). It MAY contain an
identifier (property @id), an activity (property activity, see PROV-DM activity), a generation
(property generation, see PROV-DM generation), a usage (property usage, see PROV-DM usage),
further type information (property type, see PROV-DM prov:type), a label (property label), or other
properties with an explicit prefix (see PROV-DM derivation attributes).
Schema for prov:Derivation
{
"prov:Derivation": {
"type": "object",
"required": [
"@type"
],
"properties": {
"@type":           { "pattern": "Derivation
"@id":             { "$ref": "#/definitions
"activity":        { "$ref": "#/definitions
"generation":      { "$ref": "#/definitions
"usage":           { "$ref": "#/definitions
"generatedEntity": { "$ref": "#/definitions
"usedEntity":      { "$ref": "#/definitions
"type":            { "$ref": "#/definitions
"label":           { "$ref": "#/definitions
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/defini
},
§ 4.5 prov:Derivation
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
15/71
