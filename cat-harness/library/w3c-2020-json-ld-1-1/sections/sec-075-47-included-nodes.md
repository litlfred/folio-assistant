---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-075-47-included-nodes
section_title: "Included Nodes"
section_number: 4.7
pages: 52-54
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 109: Included Blocks
{
  "@context": {
    "@version": 1.1,
    "@vocab": "http://example.org/",
    "classification": {"@type": "@vocab"}
  },
  "@id": "http://example.org/org-1",
  "members": [{
    "@id":"http://example.org/person-1",
    "name": "Manu Sporny",
    "classification": "employee"
  }, {
    "@id":"http://example.org/person-2",
    "name": "Dave Longley",
    "classification": "employee"
  }, {
    "@id": "http://example.org/person-3",
    "name": "Gregg Kellogg",
    "classification": "contractor"
When flattened, this will move the employee and contractor elements from the included block into the outer array.
Included resources are described in Inclusion of Related Resources of JSON API [JSON.API] as a way to include related resources associated with
some primary resource; @included provides an analogous possibility in JSON-LD.
As a by product of the use of @included within node objects, a map may contain only @included, to provide a feature similar to that described in
§ 4.1 Advanced Context Usage, where @graph is used to described disconnected nodes.
  }],
  "@included": [{
    "@id": "http://example.org/employee",
    "label": "An Employee"
  }, {
    "@id": "http://example.org/contractor",
    "label": "A Contractor"
  }]
}
Result
Example 110: Flattened form for included blocks
Flattened (Result) 
Statements 
Turtle Open in playground
  [{
    "@id": "http://example.org/org-1",
    "http://example.org/members": [
      {"@id": "http://example.org/person-1"},
      {"@id": "http://example.org/person-2"},
      {"@id": "http://example.org/person-3"}
    ]
  }, {
    "@id": "http://example.org/employee",
    "http://example.org/label": [{"@value": "An Employee"}]
  }, {
    "@id": "http://example.org/contractor",
    "http://example.org/label": [{"@value": "A Contractor"}]
  }, {
    "@id": "http://example.org/person-1",
    "http://example.org/name": [{"@value": "Manu Sporny"}],
    "http://example.org/classification": [
      {"@id": "http://example.org/employee"}
    ]
  }, {
    "@id": "http://example.org/person-2",
    "http://example.org/name": [{"@value": "Dave Longley"}],
    "http://example.org/classification": [
      {"@id": "http://example.org/employee"}
    ]
  }, {
    "@id": "http://example.org/person-3",
    "http://example.org/name": [{"@value": "Gregg Kellogg"}],
    "http://example.org/classification": [
      {"@id": "http://example.org/contractor"}
    ]
  }
]
Input
Example 111: Describing disconnected nodes with @included
Compacted (Input) 
Expanded (Result) 
Flattened 
Statements 
Turtle Open in playground
{
  "@context": {
    "Person": "http://xmlns.com/foaf/0.1/Person",
    "name": "http://xmlns.com/foaf/0.1/name",
    "knows": {"@id": "http://xmlns.com/foaf/0.1/knows", "@type": "@id"}
  },
  "@included": [{
    "@id": "http://manu.sporny.org/about#manu",
    "@type": "Person",
    "name": "Manu Sporny",
    "knows": "https://greggkellogg.net/foaf#me"
  }, {
    "@id": "https://greggkellogg.net/foaf#me",
    "@type": "Person",
    "name": "Gregg Kellogg",
    "knows": "http://manu.sporny.org/about#manu"
  }]
}
However, in contrast to @graph, @included does not interact with other properties contained within the same map, a feature discussed further in § 4.9
Named Graphs.
This section is non-normative.
JSON-LD serializes directed graphs. That means that every property points from a node to another node or value. However, in some cases, it is
desirable to serialize in the reverse direction. Consider for example the case where a person and its children should be described in a document. If the
used vocabulary does not provide a children property but just a parent property, every node representing a child would have to be expressed with a
property pointing to the parent as in the following example.
Expressing such data is much simpler by using JSON-LD's @reverse keyword:
The @reverse keyword can also be used in expanded term definitions to create reverse properties as shown in the following example:
