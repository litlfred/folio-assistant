---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-013
section_title: "Page 13"
pages: 13-13
pdf_page: 13
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
PROV-DM prov:label), or other properties with an explicit prefix (see PROV-DM entity attributes).
(The presence of a colon ":" in the patternProperties element forces all other properties to have the
structure of a prefix, a colon, and a local name.)
Schema for prov:Entity
{
"prov:Entity": {
"type": "object",
"required": [ "@type", "@id" ],
"properties": {
"@type":      { "pattern": "Entity" },
"@id":        { "$ref": "#/definitions/Qual
"type":       { "$ref": "#/definitions/Arra
"value":      { "$ref": "#/definitions/Arra
"location":   { "$ref": "#/definitions/Arra
"label":      { "$ref": "#/definitions/Arra
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/defini
},
"additionalProperties": false
}
}
In the Schema for prov:Activity, an activity MUST contain an identifier (property @id) and a property
@type with value Activity. It MAY contain a start time (property startTime, see PROV-DM startTime),
an end time (property endTime, see PROV-DM endTime), further type information (property type, see
PROV-DM prov:type), a location (property location, see PROV-DM prov:location), a label (property
label, see PROV-DM prov:label), or other properties with an explicit prefix (see PROV-DM activity
attributes).
Schema for prov:Activity
{
"prov:Activity": {
"type": "object",
§ 4.3 prov:Activity
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
13/71
