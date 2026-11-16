---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-056
section_title: "Page 56"
pages: 56-56
pdf_page: 56
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"prov:Association": {
"type": "object",
"required": [
"@type"
],
"properties": {
"@type":      { "pattern": "Association" },
"@id":        { "$ref": "#/definitions/Qual
"activity":   { "$ref": "#/definitions/Qual
"agent" :     { "$ref": "#/definitions/Qual
"plan" :      { "$ref": "#/definitions/Qual
"type":       { "$ref": "#/definitions/Array
"role":       { "$ref": "#/definitions/Array
"label":      { "$ref": "#/definitions/Array
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/definit
},
"additionalProperties": false
},
"prov:Delegation": {
"type": "object",
"required": [
"@type"
],
"properties": {
"@type":      { "pattern": "Delegation" },
"@id":        { "$ref": "#/definitions/Qual
"delegate":   { "$ref": "#/definitions/Qual
"responsible":{ "$ref": "#/definitions/Qual
"activity":   { "$ref": "#/definitions/Qual
"type":       { "$ref": "#/definitions/Array
"label":      { "$ref": "#/definitions/Array
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/definit
},
"additionalProperties": false
},
"prov:Derivation": {
"type": "object",
"required": [
"@type"
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
56/71
