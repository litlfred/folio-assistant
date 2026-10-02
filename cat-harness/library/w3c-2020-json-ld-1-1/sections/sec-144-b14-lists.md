---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-144-b14-lists
section_title: "B.1.4 Lists"
section_number: null
pages: 87-88
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Example 160: A list of values in Turtle
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
<http://example.org/people#joebob> a foaf:Person;
  foaf:name "Joe Bob";
  foaf:nick ( "joe" "bob" "jaybee" ) .
Example 161: Same example with a list of values in JSON-LD
{
  "@context": {
    "foaf": "http://xmlns.com/foaf/0.1/"
  },
  "@id": "http://example.org/people#joebob",
  "@type": "foaf:Person",
  "foaf:name": "Joe Bob",
  "foaf:nick": {
This section is non-normative.
The following example describes three people with their respective names and homepages in RDFa [RDFA-CORE].
An example JSON-LD implementation using a single context is described below.
This section is non-normative.
The HTML Microdata [MICRODATA] example below expresses book information as a Microdata Work item.
    "@list": [ "joe", "bob", "jaybee" ]
  }
}
