---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-142-note
section_title: "Note"
section_number: null
pages: 87-87
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Note that this interpretation differs from [Turtle], in which the literal 2.78 translates to an xsd:decimal. The rationale is that most JSON tools parse
numbers with fractions as floating point numbers, so xsd:double is the most appropriate datatype to render them back in RDF.
Both JSON-LD and [Turtle] can represent sequential lists of values.
Example 157: Same embedding example in JSON-LD
{
  "@context": {
    "foaf": "http://xmlns.com/foaf/0.1/"
  },
  "@id": "http://manu.sporny.org/about#manu",
  "@type": "foaf:Person",
  "foaf:name": "Manu Sporny",
  "foaf:knows": {
    "@type": "foaf:Person",
    "foaf:name": "Gregg Kellogg"
  }
}
