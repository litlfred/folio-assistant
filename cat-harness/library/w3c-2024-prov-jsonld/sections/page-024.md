---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-024
section_title: "Page 24"
pages: 24-24
pdf_page: 24
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
In the Schema for prov:Communication, a communication MUST contain a property @type with value
Communication. It SHOULD contain an informed activity (property informed, see PROV-DM
informed) and an informant activity (property informant, see PROV-DM informant). It MAY contain
an identifier (property @id), further type information (property type, see PROV-DM prov:type), a
label (property label, see PROV-DM prov:label), or other properties with an explicit prefix (see
PROV-DM communication attributes).
Schema for prov:Communication
{
"prov:Communication": {
"type": "object",
"required": [
"@type"
],
"properties": {
"@type":      { "pattern": "Communication" 
"@id":        { "$ref": "#/definitions/Qual
"informant":  { "$ref": "#/definitions/Qual
"informed":   { "$ref": "#/definitions/Qual
"type":       { "$ref": "#/definitions/Arra
"label":      { "$ref": "#/definitions/Arra
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/defini
},
"additionalProperties": false
}
}
In the Schema for prov:Influence, an influence MUST contain a property @type with value Influence.
It SHOULD contain an influencee (property influencee, see PROV-DM influencee) and an influencer
§ 4.14 prov:Communication
§ 4.15 prov:Influence
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
24/71
