---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-014
section_title: "Page 14"
pages: 14-14
pdf_page: 14
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"required": [ "@type", "@id" ],
"properties": {
"@type":      { "pattern": "Activity" },
"@id":        { "$ref": "#/definitions/Qual
"startTime":  { "$ref": "#/definitions/Date
"endTime":    { "$ref": "#/definitions/Date
"type":       { "$ref": "#/definitions/Arra
"location":   { "$ref": "#/definitions/Arra
"label":      { "$ref": "#/definitions/Arra
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/defini
},
"additionalProperties": false
}
}
In the Schema for prov:Agent, an agent MUST contain an identifier (property @id) and a property
@type with value Agent. It MAY contain further type information (property type, see PROV-DM
prov:type), a location (property location, see PROV-DM prov:location), a label (property label, see
PROV-DM prov:label), or other properties with an explicit prefix (see PROV-DM agent attributes).
Schema for prov:Agent
{
"prov:Agent": {
"type": "object",
"required": [ "@type", "@id" ],
"properties": {
"@type":      { "pattern": "Agent" },
"@id":        { "$ref": "#/definitions/Qual
"type":       { "$ref": "#/definitions/Arra
"location":   { "$ref": "#/definitions/Arra
"label":      { "$ref": "#/definitions/Arra
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/defini
},
§ 4.4 prov:Agent
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
14/71
