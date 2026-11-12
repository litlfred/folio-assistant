---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-078-491-graph-containers
section_title: "Graph Containers"
section_number: 4.9.1
pages: 56-56
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
This section is non-normative.
In addition to indexing node objects by index, graph objects may also be indexed by an index. By using the @graph container type, introduced in
§ 4.9.1 Graph Containers in addition to @index, an object value of such a property is treated as a key-value map where the keys do not map to IRIs,
but are taken from an @index property associated with named graphs which are their values. When expanded, these must be simple graph objects
The following example describes a default graph referencing multiple named graphs using an index map.
Input
    "@context": {
      "@vocab": "http://xmlns.com/foaf/0.1/",
      "knows": {"@type": "@id"}
    },
    "@id": "http://manu.sporny.org/about#manu",
    "@type": "Person",
    "name": "Manu Sporny",
    "knows": "https://greggkellogg.net/foaf#me"
  },
  {
    "@context": {
      "@vocab": "http://xmlns.com/foaf/0.1/",
      "knows": {"@type": "@id"}
    },
    "@id": "https://greggkellogg.net/foaf#me",
    "@type": "Person",
    "name": "Gregg Kellogg",
    "knows": "http://manu.sporny.org/about#manu"
  }
]
4.9.1 Graph Containers §
Input
Example 118: Implicitly named graph
Compacted (Input) 
Expanded (Result) 
Statements 
TriG
 Open in playground
{
  "@context": {
    "@version": 1.1,
    "@base": "http://dbpedia.org/resource/",
    "said": "http://example.com/said",
    "wrote": {"@id": "http://example.com/wrote", "@container": "@graph"}
  },
  "@id": "William_Shakespeare",
  "wrote": {
    "@id": "Richard_III_of_England",
    "said": "My kingdom for a horse"
  }
}
