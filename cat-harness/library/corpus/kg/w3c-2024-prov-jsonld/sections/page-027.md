---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-027
section_title: "Page 27"
pages: 27-27
pdf_page: 27
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
],
"properties": {
"@type":      { "pattern": "Alternate" },
"@id":        { "$ref": "#/definitions/Qual
"alternate1": { "$ref": "#/definitions/Qual
"alternate2": { "$ref": "#/definitions/Qual
"type":       { "$ref": "#/definitions/Arra
"label":      { "$ref": "#/definitions/Arra
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/defini
},
"additionalProperties": false
}
}
In the Schema for prov:Membership, a membership MUST contain a property @type with value
Membership. It SHOULD contain a collection (property collection, see PROV-DM collection) and a
single entity or an array of them (property entity, see PROV-DM entity). It MAY contain an identifier
(property @id), further type information (property type, see PROV-DM prov:type), a label (property
label, see PROV-DM prov:label), or other properties with an explicit prefix. (There is no equivalent
for those properties in PROV-DM, see section Interoperability.)
Schema for prov:Membership
{
"prov:Membership": {
"type": "object",
"required": [
"@type"
],
"properties": {
"@type":       { "pattern": "Membership" },
"@id":         { "$ref": "#/definitions/Qua
"entity":      { "$ref": "#/definitions/Qua
"collection":  { "$ref": "#/definitions/Qua
"type":        { "$ref": "#/definitions/Arr
"label":       { "$ref": "#/definitions/Arr
§ 4.18 prov:Membership
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
27/71
