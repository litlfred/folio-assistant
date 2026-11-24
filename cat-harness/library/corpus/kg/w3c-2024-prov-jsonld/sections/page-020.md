---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-020
section_title: "Page 20"
pages: 20-20
pdf_page: 20
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
In the Schema for prov:Generation, a generation MUST contain a property @type with value
Generation. It SHOULD contain an entity (property entity, see PROV-DM entity) and an activity
(property activity, see PROV-DM activity). It MAY contain an identifier (property @id), a time
(property time, see PROV-DM time), a location (property location, see PROV-DM prov:location), a
role (property role, see PROV-DM prov:role), further type information (property type, see PROV-DM
prov:type), a label (property label, see PROV-DM prov:label), or other properties with an explicit
prefix (see PROV-DM generation attributes).
Schema for prov:Generation
{
"prov:Generation": {
"type": "object",
"required": [ "@type" ],
"properties": {
"@type":      { "pattern": "Generation" },
"@id":        { "$ref": "#/definitions/Qual
"entity":     { "$ref": "#/definitions/Qual
"activity":   { "$ref": "#/definitions/Qual
"time":       { "$ref": "#/definitions/Date
"type":       { "$ref": "#/definitions/Arra
"role":       { "$ref": "#/definitions/Arra
"location":   { "$ref": "#/definitions/Arra
"label":      { "$ref": "#/definitions/Arra
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/defini
},
"additionalProperties": false
}
}
§ 4.10 prov:Generation
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
20/71
