---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-058
section_title: "Page 58"
pages: 58-58
pdf_page: 58
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"generalEntity":   { "$ref": "#/definitions/
"specificEntity":  { "$ref": "#/definitions/
"type":            { "$ref": "#/definitions/
"label":           { "$ref": "#/definitions/
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/definit
},
"additionalProperties": false
},
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
"type":        { "$ref": "#/definitions/Arra
"label":       { "$ref": "#/definitions/Arra
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/definit
},
"additionalProperties": false
},
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
"type":        { "$ref": "#/definitions/Arra
"label":       { "$ref": "#/definitions/Arra
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/definit
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
58/71
