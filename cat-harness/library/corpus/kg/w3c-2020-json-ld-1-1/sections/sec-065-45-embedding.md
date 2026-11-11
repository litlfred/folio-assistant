---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-065-45-embedding
section_title: "Embedding"
section_number: 4.5
pages: 44-45
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Embedding is a JSON-LD feature that allows an author to use node objects as property values. This is a commonly used mechanism for creating a
parent-child relationship between two nodes.
Without embedding, node objects can be linked by referencing the identifier of another node object. For example:
The previous example describes two node objects, for Manu and Gregg, with the knows property defined to treat string values as identifiers.
Embedding allows the node object for Gregg to be embedded as a value of the knows property:
A node object, like the one used above, may be used in any value position in the body of a JSON-LD document.
While it is considered a best practice to identify nodes in a graph, at times this is impractical. In the data model, nodes without an explicit identifier
are called blank nodes, which can be represented in a serialization such as JSON-LD using a blank node identifier. In the previous example, the top-
level node for Manu does not have an identifier, and does not need one to describe it within the data model. However, if we were to want to describe a
knows relationship from Gregg to Manu, we would need to introduce a blank node identifier (here _:b0).
Blank node identifiers may be automatically introduced by algorithms such as flattening, but they are also useful for authors to describe such
relationships directly.
Input
Example 93: Referencing node objects
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@vocab": "http://xmlns.com/foaf/0.1/",
    "knows": {"@type": "@id"}
  },
  "@graph": [{
    "name": "Manu Sporny",
    "@type": "Person",
    "knows": "https://greggkellogg.net/foaf#me"
  }, {
    "@id": "https://greggkellogg.net/foaf#me",
    "@type": "Person",
    "name": "Gregg Kellogg"
  }]
}
Input
Example 94: Embedding a node object as property value of another node object
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@vocab": "http://xmlns.com/foaf/0.1/"
  },
  "@type": "Person",
  "name": "Manu Sporny",
  "knows": {
    "@id": "https://greggkellogg.net/foaf#me",
    "@type": "Person",
    "name": "Gregg Kellogg"
  }
}
Input
Example 95: Referencing an unidentified node
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@vocab": "http://xmlns.com/foaf/0.1/"
  },
  "@id": "_:b0",
  "@type": "Person",
  "name": "Manu Sporny",
  "knows": {
    "@id": "https://greggkellogg.net/foaf#me",
    "@type": "Person",
    "name": "Gregg Kellogg",
    "knows": {"@id": "_:b0"}
  }
}
