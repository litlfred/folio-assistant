---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-101-71-inheriting-base-iri-from-htmls-base-element
section_title: "Inheriting base IRI from HTML's base element"
section_number: 7.1
pages: 71-72
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 146: Using the document base URL to establish the default base IRI
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle
<html>
  <head>
    <base href="http://dbpedia.org/resource/"/>
    <script type="application/ld+json">
    {
      "@context": "https://json-ld.org/contexts/person.jsonld",
      "@id": "John_Lennon",
      "name": "John Lennon",
      "born": "1940-10-09",
      "spouse": "Cynthia_Lennon"
HTML allows for Dynamic changes to base URLs. This specification does not require any specific behavior, and to ensure that all systems process
the base IRI equivalently, authors SHOULD either use IRIs, or explicitly as defined in § 4.1.3 Base IRI. Implementations (particularly those natively
operating in the [DOM]) MAY take into consideration Dynamic changes to base URLs.
This section is non-normative.
Due to the HTML Restrictions for contents of <script> elements additional encoding restrictions are placed on JSON-LD data contained in script
elements.
Authors should avoid using character sequences in scripts embedded in HTML which may be confused with a comment-open, script-open, comment-
close, or script-close.
