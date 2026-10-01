---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-141-b12-embedding
section_title: "B.1.2 Embedding"
section_number: null
pages: 86-87
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Example 156: Embedding in Turtle
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
<http://manu.sporny.org/about#manu>
  a foaf:Person;
  foaf:name "Manu Sporny";
  foaf:knows [ a foaf:Person; foaf:name "Gregg Kellogg" ] .
In JSON-LD numbers and boolean values are native data types. While [Turtle] has a shorthand syntax to express such values, RDF's abstract syntax
requires that numbers and boolean values are represented as typed literals. Thus, to allow full round-tripping, the JSON-LD 1.1 Processing
Algorithms and API specification [JSON-LD11-API] defines conversion rules between JSON-LD's native data types and RDF's counterparts.
Numbers without fractions are converted to xsd:integer-typed literals, numbers with fractions to xsd:double-typed literals and the two boolean
values true and false to a xsd:boolean-typed literal. All typed literals are in canonical lexical form.
