---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-025
section_title: "Page 25"
pages: 25-25
pdf_page: 25
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
(property influencer, see PROV-DM influencer). It MAY contain an identifier (property @id), further
type information (property type, see PROV-DM prov:type), a label (property label, see PROV-DM
prov:label), or other properties with an explicit prefix (see PROV-DM influence attributes).
Schema for prov:Influence
{
"prov:Influence": {
"type": "object",
"required": [
"@type"
],
"properties": {
"@type":       { "pattern": "Influence" },
"@id":         { "$ref": "#/definitions/Qua
"influencer":  { "$ref": "#/definitions/Qua
"influencee":  { "$ref": "#/definitions/Qua
"type":        { "$ref": "#/definitions/Arr
"label":       { "$ref": "#/definitions/Arr
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/defini
},
"additionalProperties": false
}
}
In the Schema for prov:Specialization, a specialization MUST contain a property @type with value
Specialization. It SHOULD contain a specific entity (property specificEntity, see PROV-DM
specificEntity) and a general entity (property generalEntity, see PROV-DM generalEntity). It MAY
contain an identifier (property @id), further type information (property type, see PROV-DM
prov:type), a label (property label, see PROV-DM prov:label), or other properties with an explicit
prefix. (There is no equivalent for those properties in PROV-DM, see section Interoperability.)
§ 4.16 prov:Specialization
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
25/71
