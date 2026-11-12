---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-011-note
section_title: "Note"
section_number: null
pages: 5-5
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Notes are in light green boxes with a green left border and with a "Note" header in green. Notes are always informative.
This section is non-normative.
This document uses the following terms as defined in external specifications and defines terms specific to JSON-LD.
Terms imported from ECMAScript Language Specification [ECMASCRIPT], The JavaScript Object Notation (JSON) Data Interchange Format
[RFC8259], Infra Standard [INFRA], and Web IDL [WEBIDL]
array
In the JSON serialization, an array structure is represented as square brackets surrounding zero or more values. Values are separated by commas. In
the internal representation, a list (also called an array) is an ordered collection of zero or more values. While JSON-LD uses the same array
representation as JSON, the collection is unordered by default. While order is preserved in regular JSON arrays, it is not in regular JSON-LD arrays
unless specifically defined (see the Sets and Lists section of JSON-LD 1.1.
boolean
The values true and false that are used to express one of two possible states.
JSON object
In the JSON serialization, an object structure is represented as a pair of curly brackets surrounding zero or more name/value pairs (or members). A
name is a string. A single colon comes after each name, separating the name from the value. A single comma separates a value from a following
name. In JSON-LD the names in an object must be unique.
