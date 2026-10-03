---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-019
section_title: "Page 19"
pages: 19-19
pdf_page: 19
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
In the Schema for prov:Usage, a usage MUST contain a property @type with value Usage. It
SHOULD contain an activity (property activity, see PROV-DM activity) and an entity (property entity,
see PROV-DM entity). It MAY contain an identifier (property @id), a time (property time, see PROV-
DM time), a location (property location, see PROV-DM prov:location), a role (property role, see
PROV-DM prov:role), further type information (property type, see PROV-DM prov:type), a label
(property label, see PROV-DM prov:label), or other properties with an explicit prefix (see PROV-DM
usage attributes).
Schema for prov:Usage
{
"prov:Usage": {
"type": "object",
"required": [ "@type" ],
"properties": {
"@type":      { "pattern": "Usage" },
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
§ 4.9 prov:Usage
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
19/71
