---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-016
section_title: "Page 16"
pages: 16-16
pdf_page: 16
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"additionalProperties": false
}
}
In the Schema for prov:Attribution, attribution MUST contain a property @type with value
Attribution. It SHOULD contain the entity that is the subject of the attribution (property entity, see
PROV-DM entity) and the associated agent (property agent, see PROV-DM agent). It MAY contain an
identifier (property @id), further type information (property type, see PROV-DM prov:type), a label
(property label, see PROV-DM prov:label), or other properties witn an explicit prefix (see PROV-DM
attribution attributes).
Schema for prov:Attribution
{
"prov:Attribution": {
"type": "object",
"required": [
"@type"
],
"properties": {
"@type":      { "pattern": "Attribution" },
"@id":        { "$ref": "#/definitions/Qual
"entity":     { "$ref": "#/definitions/Qual
"agent" :     { "$ref": "#/definitions/Qual
"type":       { "$ref": "#/definitions/Arra
"label":      { "$ref": "#/definitions/Arra
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/defini
},
"additionalProperties": false
}
}
§ 4.6 prov:Attribution
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
16/71
