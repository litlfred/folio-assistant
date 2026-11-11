---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-026
section_title: "Page 26"
pages: 26-26
pdf_page: 26
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
Schema for prov:Specialization
{
"prov:Specialization": {
"type": "object",
"required": [
"@type"
],
"properties": {
"@type":           { "pattern": "Specializa
"@id":             { "$ref": "#/definitions
"generalEntity":   { "$ref": "#/definitions
"specificEntity":  { "$ref": "#/definitions
"type":            { "$ref": "#/definitions
"label":           { "$ref": "#/definitions
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/defini
},
"additionalProperties": false
}
}
In the Schema for prov:Alternate, an alternate MUST contain a property @type with value Alternate. It
SHOULD contain a first alternate (property alternate1, see PROV-DM alternate1) and a second
alternate (property alternate2, see PROV-DM alternate2). It MAY contain an identifier (property @id),
further type information (property type, see PROV-DM prov:type), a label (property label, see PROV-
DM prov:label), or other properties with an explicit prefix. (There is no equivalent for those properties
in PROV-DM, see section Interoperability.)
Schema for prov:Alternate
{
"prov:Alternate": {
"type": "object",
"required": [
"@type"
§ 4.17 prov:Alternate
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
26/71
