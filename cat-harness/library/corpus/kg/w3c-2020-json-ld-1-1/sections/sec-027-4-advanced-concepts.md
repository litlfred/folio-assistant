---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-027-4-advanced-concepts
section_title: "Advanced Concepts"
section_number: 4
pages: 17-18
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 17: Referencing Objects on the Web
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@vocab": "http://xmlns.com/foaf/0.1/",
    "knows": {"@type": "@id"}
  },
  "@id": "http://manu.sporny.org/about#manu",
  "@type": "Person",
  "name": "Manu Sporny",
  "knows": "https://greggkellogg.net/foaf#me"
}
Input
Example 18: Embedding Objects
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@vocab": "http://xmlns.com/foaf/0.1/"
  },
  "@id": "http://manu.sporny.org/about#manu",
  "@type": "Person",
  "name": "Manu Sporny",
  "knows": {
See § 4.5 Embedding details these relationships.
Indexed values
Another common idiom in JSON is to use an intermediate object to represent property values via indexing. JSON-LD allows data to be indexed in a
number of different ways, as detailed in § 4.6 Indexed Values.
Reverse Properties
JSON-LD serializes directed graphs. That means that every property points from a node to another node or value. However, in some cases, it is
desirable to serialize in the reverse direction, as detailed in § 4.8 Reverse Properties.
The following sections describe such advanced functionality in more detail.
This section is non-normative.
Section § 3.1 The Context introduced the basics of what makes JSON-LD work. This section expands on the basic principles of the context and
demonstrates how more advanced use cases can be achieved using JSON-LD.
In general, contexts may be used any time a map is defined. The only time that one cannot express a context is as a direct child of another context
definition (other than as part of an expanded term definition). For example, a JSON-LD document may have the form of an array composed of one or
more node objects, which use a context definition in each top-level node object:
The outer array is standard for a document in expanded document form and flattened document form, and may be necessary when describing a
disconnected graph, where nodes may not reference each other. In such cases, using a top-level map with a @graph property can be useful for saving
the repetition of @context. See § 4.5 Embedding for more.
    "@id": "https://greggkellogg.net/foaf#me",
    "@type": "Person",
    "name": "Gregg Kellogg"
  }
}
