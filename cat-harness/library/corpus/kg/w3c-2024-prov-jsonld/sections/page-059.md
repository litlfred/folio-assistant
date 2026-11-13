---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-059
section_title: "Page 59"
pages: 59-59
pdf_page: 59
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
},
"additionalProperties": false
},
"prov:Communication": {
"type": "object",
"required": [
"@type"
],
"properties": {
"@type":      { "pattern": "Communication" }
"@id":        { "$ref": "#/definitions/Qual
"informant":  { "$ref": "#/definitions/Qual
"informed":   { "$ref": "#/definitions/Qual
"type":       { "$ref": "#/definitions/Array
"label":      { "$ref": "#/definitions/Array
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/definit
},
"additionalProperties": false
},
"prov:Bundle": {
"type": "object",
"required": [
"@type", "@id", "@graph", "@context"
],
"properties": {
"@type":      { "pattern": "Bundle" },
"@id":        { "$ref": "#/definitions/Qual
"@context":   { "$ref": "#/definitions/Conte
"@graph":     {
"type": "array",
"items": { "$ref": "#/definitions/p
}
},
"additionalProperties": false
},
"prov:Document": {
"type": "object",
"required": [
"@context", "@graph"
],
"properties": {
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
59/71
